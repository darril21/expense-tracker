import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const { email, password, name } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });

        // Create default categories for new user
        const defaultCategories = [
            { name: "Makanan & Minuman", color: "#ef4444", icon: "🍔" },
            { name: "Transportasi", color: "#f97316", icon: "🚗" },
            { name: "Belanja", color: "#eab308", icon: "🛒" },
            { name: "Tagihan", color: "#22c55e", icon: "📄" },
            { name: "Hiburan", color: "#3b82f6", icon: "🎬" },
            { name: "Kesehatan", color: "#8b5cf6", icon: "💊" },
            { name: "Lainnya", color: "#6b7280", icon: "📦" },
        ];

        await prisma.category.createMany({
            data: defaultCategories.map((cat) => ({
                ...cat,
                userId: user.id,
            })),
        });

        return NextResponse.json(
            { message: "User created successfully", userId: user.id },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
