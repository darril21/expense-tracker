import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET dashboard statistics
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
        const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

        // Current month date range
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Previous month date range
        const prevStartDate = new Date(year, month - 2, 1);
        const prevEndDate = new Date(year, month - 1, 0, 23, 59, 59);

        // Get current month expenses
        const currentMonthExpenses = await prisma.expense.findMany({
            where: {
                userId: session.user.id,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                category: true,
            },
            orderBy: {
                date: "desc",
            },
        });

        // Get previous month total
        const prevMonthExpenses = await prisma.expense.aggregate({
            where: {
                userId: session.user.id,
                date: {
                    gte: prevStartDate,
                    lte: prevEndDate,
                },
            },
            _sum: {
                amount: true,
            },
        });

        // Get current month incomes
        const currentMonthIncomes = await prisma.income.findMany({
            where: {
                userId: session.user.id,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: {
                date: "desc",
            },
        });

        // Calculate income total
        const totalIncome = currentMonthIncomes.reduce(
            (sum, inc) => sum + inc.amount,
            0
        );

        // Calculate totals
        const currentTotal = currentMonthExpenses.reduce(
            (sum, exp) => sum + exp.amount,
            0
        );
        const previousTotal = prevMonthExpenses._sum.amount || 0;

        // Calculate percentage change
        const percentageChange =
            previousTotal > 0
                ? ((currentTotal - previousTotal) / previousTotal) * 100
                : currentTotal > 0
                    ? 100
                    : 0;

        // Group by category
        const categoryTotals = currentMonthExpenses.reduce(
            (acc, exp) => {
                const catId = exp.categoryId;
                if (!acc[catId]) {
                    acc[catId] = {
                        category: exp.category,
                        total: 0,
                        count: 0,
                    };
                }
                acc[catId].total += exp.amount;
                acc[catId].count += 1;
                return acc;
            },
            {} as Record<
                string,
                { category: (typeof currentMonthExpenses)[0]["category"]; total: number; count: number }
            >
        );

        // Sort categories by total (highest first)
        const sortedCategories = Object.values(categoryTotals).sort(
            (a, b) => b.total - a.total
        );

        // Get daily totals for chart
        const dailyTotals = currentMonthExpenses.reduce(
            (acc, exp) => {
                const day = exp.date.getDate();
                if (!acc[day]) {
                    acc[day] = 0;
                }
                acc[day] += exp.amount;
                return acc;
            },
            {} as Record<number, number>
        );

        // Fill in all days of the month
        const daysInMonth = new Date(year, month, 0).getDate();
        const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
            day: i + 1,
            amount: dailyTotals[i + 1] || 0,
        }));

        // Recent transactions (last 5)
        const recentTransactions = currentMonthExpenses.slice(0, 5);

        return NextResponse.json({
            currentTotal,
            previousTotal,
            percentageChange,
            categoryBreakdown: sortedCategories,
            dailyData,
            recentTransactions,
            totalIncome,
            balance: totalIncome - currentTotal,
            recentIncomes: currentMonthIncomes.slice(0, 5),
            month,
            year,
        });
    } catch (error) {
        console.error("Get stats error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
