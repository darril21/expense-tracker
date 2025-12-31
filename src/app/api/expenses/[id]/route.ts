import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PUT update expense
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { amount, date, categoryId, note } = await request.json();

        // Check if expense exists and belongs to user
        const existingExpense = await prisma.expense.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        });

        if (!existingExpense) {
            return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        }

        const expense = await prisma.expense.update({
            where: { id },
            data: {
                ...(amount && { amount: parseFloat(amount) }),
                ...(date && { date: new Date(date) }),
                ...(categoryId && { categoryId }),
                ...(note !== undefined && { note }),
            },
            include: {
                category: true,
            },
        });

        return NextResponse.json(expense);
    } catch (error) {
        console.error("Update expense error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE expense
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Check if expense exists and belongs to user
        const existingExpense = await prisma.expense.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        });

        if (!existingExpense) {
            return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        }

        await prisma.expense.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Expense deleted successfully" });
    } catch (error) {
        console.error("Delete expense error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
