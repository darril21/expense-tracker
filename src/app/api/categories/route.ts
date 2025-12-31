import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET all categories for current user
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const categories = await prisma.category.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                _count: {
                    select: { expenses: true },
                },
            },
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Get categories error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST create new category
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, color, icon } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: "Category name is required" },
                { status: 400 }
            );
        }

        // Check if category with same name exists
        const existingCategory = await prisma.category.findFirst({
            where: {
                name,
                userId: session.user.id,
            },
        });

        if (existingCategory) {
            return NextResponse.json(
                { error: "Category with this name already exists" },
                { status: 400 }
            );
        }

        const category = await prisma.category.create({
            data: {
                name,
                color: color || "#6366f1",
                icon,
                userId: session.user.id,
            },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error("Create category error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
