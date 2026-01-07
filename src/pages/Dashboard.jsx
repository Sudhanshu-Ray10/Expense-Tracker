import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const Dashboard = () => {
  const navigate = useNavigate();
 const [username, setUsername] = useState("");
  // 📅 Month & Year
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  // 💰 Data
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState([]);

  // 🧾 Expense Form
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  // UI
  const [message, setMessage] = useState("");

  const storageKey = `expense-data-${year}-${month}`;

  // 🔄 Load data
  useEffect(() => {
    const loadData = async () => {
      const user = auth.currentUser;
      console.log(auth.currentUser?.displayName);

      if (!user) return;

      // 🔹 Add this line to show first + last name
      setUsername(user.displayName || "");

      const docRef = doc(db, "users", user.uid, "months", `${year}-${month}`);

      const snap = await getDoc(docRef);

      if (snap.exists()) {
        setIncome(snap.data().income || "");
        setExpenses(snap.data().expenses || []);
      } else {
        setIncome("");
        setExpenses([]);
      }
    };

    loadData();
  }, [month, year]);

  // 💾 Save
  const handleSaveData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, "users", user.uid, "months", `${year}-${month}`);

    await setDoc(docRef, {
      income,
      expenses,
      updatedAt: new Date(),
    });

    setMessage("Saved to cloud ☁️");
  };

  // 🔐 Logout
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  // ➕ Add Expense
  const handleAddExpense = () => {
    if (!amount || !category) return;

    setExpenses([
      {
        id: Date.now(),
        amount: Number(amount),
        category,
        note,
      },
      ...expenses,
    ]);

    setAmount("");
    setCategory("");
    setNote("");
    setHasUnsavedChanges(true);
  };

  // ❌ Delete Expense
  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter((e) => e.id !== id));
    setHasUnsavedChanges(true);
  };

  // 🔄 Reset Month
  const handleResetMonth = () => {
    if (!window.confirm("Reset all data for this month?")) return;
    setIncome("");
    setExpenses([]);
    localStorage.removeItem(storageKey);
    setHasUnsavedChanges(false);
  };

  // 📊 Calculations
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = income ? Number(income) - totalExpense : 0;

  // 🥧 Pie Chart Data
  const pieData = Object.values(
    expenses.reduce((acc, e) => {
      acc[e.category] = acc[e.category]
        ? { name: e.category, value: acc[e.category].value + e.amount }
        : { name: e.category, value: e.amount };
      return acc;
    }, {})
  );

  // 📊 Bar Chart Data (category-wise)
  const barData = Object.values(
    expenses.reduce((acc, e) => {
      acc[e.category] = acc[e.category]
        ? { category: e.category, amount: acc[e.category].amount + e.amount }
        : { category: e.category, amount: e.amount };
      return acc;
    }, {})
  );

  // 📄 Download PDF
  const downloadPDF = async () => {
    const doc = new jsPDF("p", "mm", "a4");

    doc.setFontSize(18);
    doc.text("Expense Report", 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text(`${months[month]} ${year}`, 105, 23, { align: "center" });

    doc.setFillColor(245, 245, 245);
    doc.rect(14, 30, 182, 25, "F");

    doc.text(`Income: Rs-${income || 0}`, 20, 40);
    doc.text(`Expense: Rs-${totalExpense}`, 80, 40);
    doc.text(`Balance: Rs-${balance}`, 150, 40);

    let y = 65;

    // wait for charts to render
    await new Promise((res) => setTimeout(res, 300));

    // ===== PIE CHART =====
    const pieEl = document.getElementById("pie-chart-pdf");
    if (pieEl) {
      const pieCanvas = await html2canvas(pieEl, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
      });

      const pieImg = pieCanvas.toDataURL("image/jpeg", 1.0);
      doc.text("Category Distribution", 14, y - 5);
      doc.addImage(pieImg, "JPEG", 14, y, 70, 50);
    }

    // ===== BAR CHART =====
    const barEl = document.getElementById("bar-chart-pdf");
    if (barEl) {
      const barCanvas = await html2canvas(barEl, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
      });

      const barImg = barCanvas.toDataURL("image/jpeg", 1.0);
      doc.text("Category-wise Expenses", 110, y - 5);
      doc.addImage(barImg, "JPEG", 110, y, 70, 50);
    }

    // ===== TABLE =====
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Transactions", 14, 15);
    autoTable(doc, {
      startY: y + 70,
      head: [["Category", "Amount"]],
      body: pieData.map((p) => [p.name, `₹${p.value}`]),
      theme: "grid",
      styles: { fontSize: 10 },
    });

    autoTable(doc, {
      startY: 22,
      head: [["#", "Category", "Amount", "Note"]],
      body: expenses.map((e, i) => [
        i + 1,
        e.category,
        `Rs-${e.amount}`,
        e.note || "-",
      ]),
      theme: "striped",
      headStyles: { fillColor: [99, 102, 241] },
    });

    doc.save(`Expense-Report-${months[month]}-${year}.pdf`);
  };

  // 📊 Download Excel
  const downloadExcel = () => {
    const excelData = expenses.map((e, i) => ({
      No: i + 1,
      Category: e.category,
      Amount: e.amount,
      Note: e.note || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(fileData, `Expenses-${months[month]}-${year}.xlsx`);
  };

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
     <div className="w-full flex flex-col md:flex-row items-center justify-between mb-8 gap-4">

  {/* LEFT = Username */}
  <h2 className="text-2xl font-bold text-slate-800 w-full md:w-auto text-left">
    {username ? `Welcome Back, ${username} 👋` : "Welcome Back 👋"}
  </h2>

  {/* CENTER = Title */}
  <h1 className="text-3xl md:text-4xl font-bold text-slate-800 text-center flex-1">
    Expense Tracker 💸
  </h1>

  {/* RIGHT = Logout */}
  <button
    onClick={handleLogout}
    className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg transition-colors duration-200 font-medium w-full md:w-auto"
  >
    Logout
  </button>

</div>

      {/* Month / Year / Actions + Download */}
      <div className="bg-white p-6 rounded shadow mb-6 flex flex-wrap justify-between gap-4 items-center">
        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="p-3 border rounded"
          >
            {months.map((m, i) => (
              <option key={i} value={i}>
                {m}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleSaveData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-colors duration-200 font-medium"
          >
            Save 💾
          </button>

          <button
            onClick={handleResetMonth}
            className="bg-orange-500 text-white px-4 py-2 rounded"
          >
            Reset 🔄
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={downloadPDF}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Download PDF 📄
          </button>
          <button
            onClick={downloadExcel}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Download Excel 📊
          </button>
        </div>
      </div>

      {message && <p className="text-green-600 mb-4">{message}</p>}

      {/* Monthly Income */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">Monthly Income</h2>
        <input
          type="number"
          value={income}
          onChange={(e) => {
            setIncome(e.target.value);
            setHasUnsavedChanges(true);
          }}
          className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card
          title="Income"
          value={`₹${income || 0}`}
          color="from-blue-500 to-blue-600"
        />
        <Card
          title="Expense"
          value={`₹${totalExpense}`}
          color="from-red-500 to-red-600"
        />
        <Card
          title="Balance"
          value={`₹${balance}`}
          color="from-green-500 to-green-600"
        />
        <Card
          title="Transactions"
          value={expenses.length}
          color="from-purple-500 to-purple-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Chart title="Expense Distribution">
          <div
            id="pie-chart-pdf"
            style={{
              width: "500px",
              height: "350px",
              background: "#ffffff",
              padding: "10px",
            }}
          >
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={90}
                labelLine={false}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>

              <Tooltip formatter={(v) => `₹${v}`} />

              <Legend
                formatter={(value, entry) =>
                  `${value} : ₹${entry.payload.value}`
                }
              />
            </PieChart>
          </div>
        </Chart>

        <Chart title="Category-wise Expenses">
          <div
            id="bar-chart-pdf"
            style={{
              width: "500px",
              height: "350px",
              background: "#ffffff",
              padding: "10px",
            }}
          >
            <BarChart
              width={500}
              height={350}
              data={barData}
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="amount"
                fill="#6366f1"
                label={{ position: "top", fill: "#000", fontSize: 10 }}
              />
            </BarChart>
          </div>
        </Chart>
      </div>

      {/* Add Expense */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Add Expense</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-3 border rounded"
          >
            <option value="">Category</option>
            <option>Food</option>
            <option>Rent</option>
            <option>Transport</option>
            <option>Shopping</option>
            <option>Others</option>
          </select>
          <input
            type="text"
            placeholder="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddExpense}
            className="bg-green-500 text-white rounded px-4 py-3"
          >
            Add
          </button>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">
          Transactions ({months[month]} {year})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                  Category
                </th>
                <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                  Note
                </th>
                <th className="text-right py-3 px-4 text-slate-700 font-semibold">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 px-4 text-slate-800">{e.category}</td>
                  <td className="py-3 px-4 text-slate-800 font-medium">
                    ₹{e.amount}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{e.note || "-"}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteExpense(e.id)}
                      className="text-red-600 hover:text-red-700 font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Card = ({ title, value, color }) => (
  <div
    className={`bg-gradient-to-br ${color} text-white p-6 rounded-xl shadow-md`}
  >
    <h3 className="text-sm font-medium opacity-90">{title}</h3>
    <p className="text-3xl font-bold mt-2">{value}</p>
  </div>
);

const Chart = ({ title, children }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
    <h2 className="text-lg font-semibold text-slate-800 mb-4">{title}</h2>
    <ResponsiveContainer width="100%" height={300}>
      {children}
    </ResponsiveContainer>
  </div>
);

export default Dashboard;
