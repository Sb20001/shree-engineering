import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
import * as XLSX from "npm:xlsx";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize storage bucket
async function initStorage() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketName = 'make-7ef5248e-products';
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, { public: false });
      console.log(`Created bucket: ${bucketName}`);
    }
    
    const profileBucket = 'make-7ef5248e-profiles';
    const profileBucketExists = buckets?.some(bucket => bucket.name === profileBucket);
    
    if (!profileBucketExists) {
      await supabase.storage.createBucket(profileBucket, { public: false });
      console.log(`Created bucket: ${profileBucket}`);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

initStorage();

// Health check endpoint
app.get("/make-server-7ef5248e/health", (c) => {
  return c.json({ status: "ok" });
});

// ============= AUTH ROUTES =============

// Register new user
app.post("/make-server-7ef5248e/auth/register", async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();
    
    if (!email || !password || !name || !role) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      email_confirm: true // Automatically confirm email
    });
    
    if (authError) {
      return c.json({ error: `Registration error: ${authError.message}` }, 400);
    }
    
    // Store user data in KV store
    const userId = authData.user.id;
    const userData = {
      id: userId,
      email,
      name,
      role, // customer, employee, member, owner
      createdAt: new Date().toISOString(),
      profilePhoto: null
    };
    
    await kv.set(`user:${userId}`, userData);
    await kv.set(`user:email:${email}`, userId);
    
    return c.json({ success: true, userId, message: "User registered successfully" });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: `Server error during registration: ${error.message}` }, 500);
  }
});

// Get current user
app.get("/make-server-7ef5248e/auth/user", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No authorization token" }, 401);
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const userData = await kv.get(`user:${user.id}`);
    
    return c.json({ user: userData || user });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: `Error fetching user: ${error.message}` }, 500);
  }
});

// ============= PRODUCT ROUTES =============

// Create product (members and owners only)
app.post("/make-server-7ef5248e/products", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const userData = await kv.get(`user:${user.id}`);
    if (!userData || (userData.role !== 'member' && userData.role !== 'owner')) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }
    
    const { name, description, price, category, stock, imageUrl } = await c.req.json();
    
    const productId = crypto.randomUUID();
    const product = {
      id: productId,
      name,
      description,
      price,
      category,
      stock,
      imageUrl,
      createdBy: user.id,
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`product:${productId}`, product);
    
    // Add to products list
    const products = await kv.get('products:list') || [];
    products.push(productId);
    await kv.set('products:list', products);
    
    return c.json({ success: true, product });
  } catch (error) {
    console.error('Create product error:', error);
    return c.json({ error: `Error creating product: ${error.message}` }, 500);
  }
});

// Get all products
app.get("/make-server-7ef5248e/products", async (c) => {
  try {
    const productIds = await kv.get('products:list') || [];
    const products = await Promise.all(
      productIds.map(async (id: string) => await kv.get(`product:${id}`))
    );
    
    return c.json({ products: products.filter(p => p !== null) });
  } catch (error) {
    console.error('Get products error:', error);
    return c.json({ error: `Error fetching products: ${error.message}` }, 500);
  }
});

// Get single product
app.get("/make-server-7ef5248e/products/:id", async (c) => {
  try {
    const productId = c.req.param('id');
    const product = await kv.get(`product:${productId}`);
    
    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }
    
    return c.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    return c.json({ error: `Error fetching product: ${error.message}` }, 500);
  }
});

// Update product
app.put("/make-server-7ef5248e/products/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const userData = await kv.get(`user:${user.id}`);
    if (!userData || (userData.role !== 'member' && userData.role !== 'owner')) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }
    
    const productId = c.req.param('id');
    const updates = await c.req.json();
    
    const product = await kv.get(`product:${productId}`);
    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }
    
    const updatedProduct = { ...product, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(`product:${productId}`, updatedProduct);
    
    return c.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Update product error:', error);
    return c.json({ error: `Error updating product: ${error.message}` }, 500);
  }
});

// Delete product
app.delete("/make-server-7ef5248e/products/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const userData = await kv.get(`user:${user.id}`);
    if (!userData || userData.role !== 'owner') {
      return c.json({ error: "Insufficient permissions" }, 403);
    }
    
    const productId = c.req.param('id');
    await kv.del(`product:${productId}`);
    
    // Remove from products list
    const products = await kv.get('products:list') || [];
    const updatedProducts = products.filter((id: string) => id !== productId);
    await kv.set('products:list', updatedProducts);
    
    return c.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error('Delete product error:', error);
    return c.json({ error: `Error deleting product: ${error.message}` }, 500);
  }
});

// ============= CART ROUTES =============

// Get user cart
app.get("/make-server-7ef5248e/cart", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const cart = await kv.get(`cart:${user.id}`) || { items: [] };
    return c.json({ cart });
  } catch (error) {
    console.error('Get cart error:', error);
    return c.json({ error: `Error fetching cart: ${error.message}` }, 500);
  }
});

// Add to cart
app.post("/make-server-7ef5248e/cart", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { productId, quantity } = await c.req.json();
    
    const cart = await kv.get(`cart:${user.id}`) || { items: [] };
    
    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex((item: any) => item.productId === productId);
    
    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity, addedAt: new Date().toISOString() });
    }
    
    await kv.set(`cart:${user.id}`, cart);
    
    return c.json({ success: true, cart });
  } catch (error) {
    console.error('Add to cart error:', error);
    return c.json({ error: `Error adding to cart: ${error.message}` }, 500);
  }
});

// Remove from cart
app.delete("/make-server-7ef5248e/cart/:productId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const productId = c.req.param('productId');
    const cart = await kv.get(`cart:${user.id}`) || { items: [] };
    
    cart.items = cart.items.filter((item: any) => item.productId !== productId);
    await kv.set(`cart:${user.id}`, cart);
    
    return c.json({ success: true, cart });
  } catch (error) {
    console.error('Remove from cart error:', error);
    return c.json({ error: `Error removing from cart: ${error.message}` }, 500);
  }
});

// Clear cart
app.delete("/make-server-7ef5248e/cart", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    await kv.set(`cart:${user.id}`, { items: [] });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Clear cart error:', error);
    return c.json({ error: `Error clearing cart: ${error.message}` }, 500);
  }
});

// ============= PROFILE ROUTES =============

// Update profile
app.put("/make-server-7ef5248e/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const updates = await c.req.json();
    const userData = await kv.get(`user:${user.id}`);
    
    const updatedUser = { ...userData, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(`user:${user.id}`, updatedUser);
    
    return c.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ error: `Error updating profile: ${error.message}` }, 500);
  }
});

// Upload profile photo
app.post("/make-server-7ef5248e/profile/photo", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { imageData, fileName } = await c.req.json();
    
    // Convert base64 to blob
    const base64Data = imageData.split(',')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const filePath = `${user.id}/${fileName}`;
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('make-7ef5248e-profiles')
      .upload(filePath, binaryData, { upsert: true });
    
    if (uploadError) {
      return c.json({ error: `Upload error: ${uploadError.message}` }, 500);
    }
    
    // Get signed URL
    const { data: urlData } = await supabase.storage
      .from('make-7ef5248e-profiles')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year
    
    const photoUrl = urlData?.signedUrl;
    
    // Update user profile
    const userData = await kv.get(`user:${user.id}`);
    userData.profilePhoto = photoUrl;
    await kv.set(`user:${user.id}`, userData);
    
    return c.json({ success: true, photoUrl });
  } catch (error) {
    console.error('Upload photo error:', error);
    return c.json({ error: `Error uploading photo: ${error.message}` }, 500);
  }
});

// ============= ATTENDANCE ROUTES =============

// Clock in
app.post("/make-server-7ef5248e/attendance/clock-in", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const userData = await kv.get(`user:${user.id}`);
    if (!userData || userData.role !== 'employee') {
      return c.json({ error: "Only employees can clock in" }, 403);
    }
    
    const today = new Date().toISOString().split('T')[0];
    const attendanceId = `${user.id}:${today}`;
    
    const attendance = {
      userId: user.id,
      date: today,
      clockIn: new Date().toISOString(),
      clockOut: null,
      totalHours: null
    };
    
    await kv.set(`attendance:${attendanceId}`, attendance);
    
    return c.json({ success: true, attendance });
  } catch (error) {
    console.error('Clock in error:', error);
    return c.json({ error: `Error clocking in: ${error.message}` }, 500);
  }
});

// Clock out
app.post("/make-server-7ef5248e/attendance/clock-out", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const userData = await kv.get(`user:${user.id}`);
    if (!userData || userData.role !== 'employee') {
      return c.json({ error: "Only employees can clock out" }, 403);
    }
    
    const today = new Date().toISOString().split('T')[0];
    const attendanceId = `${user.id}:${today}`;
    
    const attendance = await kv.get(`attendance:${attendanceId}`);
    
    if (!attendance) {
      return c.json({ error: "No clock in record found for today" }, 404);
    }
    
    const clockOut = new Date();
    const clockIn = new Date(attendance.clockIn);
    const totalHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
    
    attendance.clockOut = clockOut.toISOString();
    attendance.totalHours = totalHours.toFixed(2);
    
    await kv.set(`attendance:${attendanceId}`, attendance);
    
    return c.json({ success: true, attendance });
  } catch (error) {
    console.error('Clock out error:', error);
    return c.json({ error: `Error clocking out: ${error.message}` }, 500);
  }
});

// Get attendance records
app.get("/make-server-7ef5248e/attendance", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const userData = await kv.get(`user:${user.id}`);
    
    // Get attendance records
    const prefix = userData.role === 'owner' ? 'attendance:' : `attendance:${user.id}:`;
    const records = await kv.getByPrefix(prefix);
    
    return c.json({ attendance: records });
  } catch (error) {
    console.error('Get attendance error:', error);
    return c.json({ error: `Error fetching attendance: ${error.message}` }, 500);
  }
});

// ============= EXPORT ROUTES =============

// Export users to Excel
app.get("/make-server-7ef5248e/export/users", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const userData = await kv.get(`user:${user.id}`);
    if (!userData || userData.role !== 'owner') {
      return c.json({ error: "Only owners can export user data" }, 403);
    }
    
    // Get all users
    const users = await kv.getByPrefix('user:');
    const filteredUsers = users.filter((u: any) => u.id); // Filter out email mappings
    
    // Prepare data for Excel
    const excelData = filteredUsers.map((u: any) => ({
      ID: u.id,
      Name: u.name,
      Email: u.email,
      Role: u.role,
      'Created At': u.createdAt
    }));
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    
    // Write to file
    const filePath = '/tmp/users.xlsx';
    XLSX.writeFile(wb, filePath);
    
    // Read file as base64
    const fileData = await Deno.readFile(filePath);
    const base64 = btoa(String.fromCharCode(...fileData));
    
    return c.json({ 
      success: true, 
      fileName: 'users.xlsx',
      data: base64 
    });
  } catch (error) {
    console.error('Export users error:', error);
    return c.json({ error: `Error exporting users: ${error.message}` }, 500);
  }
});

// Get all users (for owner/admin)
app.get("/make-server-7ef5248e/users", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const userData = await kv.get(`user:${user.id}`);
    if (!userData || (userData.role !== 'owner' && userData.role !== 'member')) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }
    
    const users = await kv.getByPrefix('user:');
    const filteredUsers = users.filter((u: any) => u.id);
    
    return c.json({ users: filteredUsers });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: `Error fetching users: ${error.message}` }, 500);
  }
});

Deno.serve(app.fetch);
