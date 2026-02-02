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

        // Get user's billing cycle start day
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { billingCycleStart: true },
        });
        const cycleStart = user?.billingCycleStart || 1;

        // Calculate date range based on billing cycle
        // If cycleStart = 25, "January 2026" = Dec 25, 2025 - Jan 24, 2026
        let startDate: Date;
        let endDate: Date;
        let prevStartDate: Date;
        let prevEndDate: Date;

        if (cycleStart === 1) {
            // Standard calendar month
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0, 23, 59, 59);
            prevStartDate = new Date(year, month - 2, 1);
            prevEndDate = new Date(year, month - 1, 0, 23, 59, 59);
        } else {
            // Custom billing cycle
            // Start: (cycleStart) of previous month
            // End: (cycleStart - 1) of current month
            startDate = new Date(year, month - 2, cycleStart);
            endDate = new Date(year, month - 1, cycleStart - 1, 23, 59, 59);
            prevStartDate = new Date(year, month - 3, cycleStart);
            prevEndDate = new Date(year, month - 2, cycleStart - 1, 23, 59, 59);
        }

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

        // Get daily totals for chart - handle split months for custom billing cycle
        let dailyData: { day: number; amount: number }[] = [];
        let dailyDataMonth1: { day: number; amount: number }[] | null = null;
        let dailyDataMonth2: { day: number; amount: number }[] | null = null;
        let month1Label = "";
        let month2Label = "";

        if (cycleStart === 1) {
            // Standard calendar month - single chart
            const dailyTotals = currentMonthExpenses.reduce(
                (acc, exp) => {
                    const day = exp.date.getDate();
                    if (!acc[day]) acc[day] = 0;
                    acc[day] += exp.amount;
                    return acc;
                },
                {} as Record<number, number>
            );
            const daysInMonth = new Date(year, month, 0).getDate();
            dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
                day: i + 1,
                amount: dailyTotals[i + 1] || 0,
            }));
        } else {
            // Custom billing cycle - split into two charts
            // Month 1: Previous month (cycleStart to end of month)
            // Month 2: Current month (1 to cycleStart-1)
            const prevMonth = month - 2;
            const currMonth = month - 1;
            const prevMonthYear = prevMonth < 0 ? year - 1 : year;
            const adjustedPrevMonth = prevMonth < 0 ? 12 + prevMonth : prevMonth;

            const daysInPrevMonth = new Date(prevMonthYear, adjustedPrevMonth + 1, 0).getDate();
            const daysInCurrMonth = cycleStart - 1;

            // Create month labels
            const prevMonthName = new Date(prevMonthYear, adjustedPrevMonth, 1).toLocaleDateString("id-ID", { month: "short" });
            const currMonthName = new Date(year, currMonth, 1).toLocaleDateString("id-ID", { month: "short" });
            month1Label = `${prevMonthName} (${cycleStart}-${daysInPrevMonth})`;
            month2Label = `${currMonthName} (1-${daysInCurrMonth})`;

            // Group expenses by which month they belong to
            const month1Totals: Record<number, number> = {};
            const month2Totals: Record<number, number> = {};

            currentMonthExpenses.forEach((exp) => {
                const expMonth = exp.date.getMonth();
                const day = exp.date.getDate();

                if (expMonth === adjustedPrevMonth) {
                    // First month portion
                    if (!month1Totals[day]) month1Totals[day] = 0;
                    month1Totals[day] += exp.amount;
                } else {
                    // Second month portion
                    if (!month2Totals[day]) month2Totals[day] = 0;
                    month2Totals[day] += exp.amount;
                }
            });

            // Build arrays for first month (cycleStart to end of month)
            dailyDataMonth1 = [];
            for (let d = cycleStart; d <= daysInPrevMonth; d++) {
                dailyDataMonth1.push({ day: d, amount: month1Totals[d] || 0 });
            }

            // Build arrays for second month (1 to cycleStart-1)
            dailyDataMonth2 = [];
            for (let d = 1; d <= daysInCurrMonth; d++) {
                dailyDataMonth2.push({ day: d, amount: month2Totals[d] || 0 });
            }

            // Legacy dailyData for backward compatibility
            dailyData = [...dailyDataMonth1, ...dailyDataMonth2];
        }

        // Recent transactions (last 5)
        const recentTransactions = currentMonthExpenses.slice(0, 5);

        return NextResponse.json({
            currentTotal,
            previousTotal,
            percentageChange,
            categoryBreakdown: sortedCategories,
            dailyData,
            dailyDataMonth1,
            dailyDataMonth2,
            month1Label,
            month2Label,
            cycleStart,
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
