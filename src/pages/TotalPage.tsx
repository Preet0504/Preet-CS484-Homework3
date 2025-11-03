import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchExpenses } from "../utils";
import { formatMoney } from "../utils";
import type { Expense } from "../types";

const TotalPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    (async () => {
      try {
        //TODO: Fetch the expenses
        const list = await fetchExpenses() as Expense[];
        setExpenses(list);
      } catch (e) {
        console.error("Failed to fetch expenses:", e);
        setExpenses([]);
      }
    })();
  }, []);

  const computeTotal = (expenses: Expense[]) => {
    //TODO: Compute the total cost of all expenses
    return expenses
      .filter((e) => !e.deleted) // Only include non-deleted expenses
      .reduce((sum, expense) => sum + Number(expense.cost), 0);
  };

  return (
    <div className="page">
      <div className="header">
        <h1 data-testid="page-total">Total</h1>
        <div className="spacer" />
        <Link className="link" to="/">
          ← Back to List
        </Link>
      </div>

      <div className="total-card">
        <div className="total-label">Grand Total</div>
        <div className="total-value" data-testid="total-value">
          {formatMoney(computeTotal(expenses))}
        </div>
      </div>
    </div>
  );
};

export default TotalPage;
