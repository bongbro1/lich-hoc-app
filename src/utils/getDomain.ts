export type Domain = "ICTU" | "TNUT" | "UNKNOWN";

// Helper function nhận studentId và trả về domain
export function getDomainFromStudentId(studentId: string): Domain {
  if (!studentId) return "UNKNOWN";

  const id = studentId.trim().toLowerCase();

  if (id.startsWith("dtc")) {
    return "ICTU";
  }

  if (/^k\d+/.test(id)) {
    return "TNUT";
  }

  return "UNKNOWN";
}