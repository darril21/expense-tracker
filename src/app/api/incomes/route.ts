import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET incomes for a month
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
        const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const incomes = await prisma.income.findMany({
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

        const total = incomes.reduce((sum, inc) => sum + inc.amount, 0);

        return NextResponse.json({ incomes, total });
    } catch (error) {
        console.error("Get incomes error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST create new income
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { amount, type, date, note } = body;

        if (!amount || !type || !date) {
            return NextResponse.json(
                { error: "Amount, type, and date are required" },
                { status: 400 }
            );
        }

        const income = await prisma.income.create({
            data: {
                amount: parseFloat(amount),
                type,
                date: new Date(date),
                note: note || null,
                userId: session.user.id,
            },
        });

        return NextResponse.json(income, { status: 201 });
    } catch (error) {
        console.error("Create income error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
