import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PUT update income
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
        const body = await request.json();
        const { amount, type, date, note } = body;

        // Check if income exists and belongs to user
        const existing = await prisma.income.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        });

        if (!existing) {
            return NextResponse.json({ error: "Income not found" }, { status: 404 });
        }

        const income = await prisma.income.update({
            where: { id },
            data: {
                amount: amount ? parseFloat(amount) : undefined,
                type: type || undefined,
                date: date ? new Date(date) : undefined,
                note: note !== undefined ? note : undefined,
            },
        });

        return NextResponse.json(income);
    } catch (error) {
        console.error("Update income error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE income
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

        // Check if income exists and belongs to user
        const existing = await prisma.income.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        });

        if (!existing) {
            return NextResponse.json({ error: "Income not found" }, { status: 404 });
        }

        await prisma.income.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete income error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
