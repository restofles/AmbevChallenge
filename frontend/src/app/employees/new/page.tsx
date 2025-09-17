import { Navbar } from "@/components/Navbar";
import EmployeeForm from "@/components/EmployeeForm";

export default function NewEmployeePage() {
  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: "1.5rem 0" }}>
        <EmployeeForm />
      </main>
    </>
  );
}
