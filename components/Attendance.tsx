import { useState, useEffect } from "react";
import { Clock, Calendar, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { projectId } from "../utils/supabase/info";

interface AttendanceProps {
  accessToken: string;
  user: any;
}

export function Attendance({ accessToken, user }: AttendanceProps) {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7ef5248e/attendance`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAttendance(data.attendance || []);
        
        // Find today's attendance
        const today = new Date().toISOString().split('T')[0];
        const todayRecord = data.attendance?.find((a: any) => a.date === today && a.userId === user.id);
        setTodayAttendance(todayRecord || null);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7ef5248e/attendance/clock-in`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Clocked in successfully!");
        fetchAttendance();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to clock in");
      }
    } catch (error) {
      console.error("Clock in error:", error);
      toast.error("An error occurred while clocking in");
    }
  };

  const handleClockOut = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7ef5248e/attendance/clock-out`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Clocked out successfully!");
        fetchAttendance();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to clock out");
      }
    } catch (error) {
      console.error("Clock out error:", error);
      toast.error("An error occurred while clocking out");
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading attendance...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl mb-8 text-gray-900">Employee Attendance</h1>

        {/* Today's Status */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl text-gray-900 mb-2">Today's Status</h2>
              <p className="text-gray-600">{new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
            <Clock className="w-12 h-12 text-blue-600" />
          </div>

          {todayAttendance ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <div className="text-gray-900">Clock In</div>
                  <div className="text-xl text-green-600">{formatTime(todayAttendance.clockIn)}</div>
                </div>
              </div>

              {todayAttendance.clockOut ? (
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="text-gray-900">Clock Out</div>
                    <div className="text-xl text-blue-600">{formatTime(todayAttendance.clockOut)}</div>
                  </div>
                  <div className="ml-auto">
                    <div className="text-gray-600">Total Hours</div>
                    <div className="text-2xl text-gray-900">{todayAttendance.totalHours}h</div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleClockOut}
                  className="w-full px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-lg"
                >
                  Clock Out
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <XCircle className="w-6 h-6 text-gray-400" />
                <div className="text-gray-600">You haven't clocked in today</div>
              </div>
              <button
                onClick={handleClockIn}
                className="w-full px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg"
              >
                Clock In
              </button>
            </div>
          )}
        </div>

        {/* Attendance History */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl text-gray-900">Attendance History</h2>
          </div>

          {user?.role === 'owner' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs uppercase text-gray-700">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs uppercase text-gray-700">Date</th>
                    <th className="px-6 py-3 text-left text-xs uppercase text-gray-700">Clock In</th>
                    <th className="px-6 py-3 text-left text-xs uppercase text-gray-700">Clock Out</th>
                    <th className="px-6 py-3 text-left text-xs uppercase text-gray-700">Total Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendance.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-600 text-sm">{record.userId.substring(0, 8)}...</td>
                      <td className="px-6 py-4 text-gray-900">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-900">{formatTime(record.clockIn)}</td>
                      <td className="px-6 py-4 text-gray-900">
                        {record.clockOut ? formatTime(record.clockOut) : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {record.totalHours ? `${record.totalHours}h` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {attendance
                .filter((record: any) => record.userId === user.id)
                .map((record, index) => (
                  <div key={index} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Calendar className="w-8 h-8 text-blue-600" />
                        <div>
                          <div className="text-lg text-gray-900">
                            {new Date(record.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatTime(record.clockIn)} - {record.clockOut ? formatTime(record.clockOut) : 'In Progress'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Total Hours</div>
                        <div className="text-2xl text-gray-900">
                          {record.totalHours ? `${record.totalHours}h` : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {attendance.length === 0 && (
            <div className="p-12 text-center text-gray-600">
              No attendance records found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
