import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET all expenses for the current user
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const month = searchParams.get("month");
        const year = searchParams.get("year");
        const categoryId = searchParams.get("categoryId");

        let dateFilter = {};
        if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
            dateFilter = {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            };
        }

        const expenses = await prisma.expense.findMany({
            where: {
                userId: session.user.id,
                ...dateFilter,
                ...(categoryId && { categoryId }),
            },
            include: {
                category: true,
            },
            orderBy: {
                date: "desc",
            },
        });

        return NextResponse.json(expenses);
    } catch (error) {
        console.error("Get expenses error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST create new expense
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { amount, date, categoryId, note } = await request.json();

        if (!amount || !date || !categoryId) {
            return NextResponse.json(
                { error: "Amount, date, and category are required" },
                { status: 400 }
            );
        }

        const expense = await prisma.expense.create({
            data: {
                amount: parseFloat(amount),
                date: new Date(date),
                note,
                categoryId,
                userId: session.user.id,
            },
            include: {
                category: true,
            },
        });

        return NextResponse.json(expense, { status: 201 });
    } catch (error) {
        console.error("Create expense error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
