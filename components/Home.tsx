import { Link } from "wouter";
import { ArrowRight, Shield, Truck, Wrench, Zap } from "lucide-react";
import { motion } from "motion/react";

export function Home() {
  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Quality Assured",
      description: "All parts certified and tested for reliability"
    },
    {
      icon: <Truck className="w-8 h-8" />,
      title: "Fast Delivery",
      description: "Quick shipping to keep your operations running"
    },
    {
      icon: <Wrench className="w-8 h-8" />,
      title: "Expert Support",
      description: "Technical assistance from industry professionals"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Wide Selection",
      description: "Thousands of parts for all machinery types"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 to-blue-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl mb-6">
                Industrial Machine Parts for Every Need
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                Your trusted partner for quality machinery components. Serving industries worldwide with precision and reliability.
              </p>
              <div className="flex gap-4">
                <Link href="/products">
                  <button className="px-8 py-3 bg-white text-blue-900 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2">
                    Browse Products
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                <Link href="/contact">
                  <button className="px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-900 transition-colors">
                    Contact Us
                  </button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative h-96 rounded-lg overflow-hidden shadow-2xl"
            >
              <img
                src="https://images.unsplash.com/photo-1759148413911-5ded7ed2ec06?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwbWFjaGluZXJ5JTIwcGFydHN8ZW58MXx8fHwxNzYyNzY2NDMwfDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Industrial machinery"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl mb-4 text-gray-900">Why Choose Us</h2>
            <p className="text-xl text-gray-600">Excellence in every aspect of service</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10,000+", label: "Products" },
              { value: "5,000+", label: "Happy Clients" },
              { value: "50+", label: "Countries" },
              { value: "24/7", label: "Support" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-5xl mb-2">{stat.value}</div>
                <div className="text-xl text-blue-200">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white">
            <h2 className="text-4xl mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of satisfied customers worldwide
            </p>
            <Link href="/products">
              <button className="px-8 py-3 bg-white text-blue-900 rounded-lg hover:bg-blue-50 transition-colors">
                Explore Products
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
