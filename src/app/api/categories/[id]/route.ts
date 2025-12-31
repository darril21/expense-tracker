import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PUT update category
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
        const { name, color, icon } = await request.json();

        // Check if category exists and belongs to user
        const existingCategory = await prisma.category.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        });

        if (!existingCategory) {
            return NextResponse.json(
                { error: "Category not found" },
                { status: 404 }
            );
        }

        const category = await prisma.category.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(color && { color }),
                ...(icon !== undefined && { icon }),
            },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Update category error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE category
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

        // Check if category exists and belongs to user
        const existingCategory = await prisma.category.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        });

        if (!existingCategory) {
            return NextResponse.json(
                { error: "Category not found" },
                { status: 404 }
            );
        }

        // Check if category has expenses
        const expenseCount = await prisma.expense.count({
            where: { categoryId: id },
        });

        if (expenseCount > 0) {
            return NextResponse.json(
                {
                    error: `Cannot delete category with ${expenseCount} expenses. Delete or move expenses first.`,
                },
                { status: 400 }
            );
        }

        await prisma.category.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Delete category error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
