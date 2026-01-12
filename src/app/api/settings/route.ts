import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET user settings
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { billingCycleStart: true },
        });

        return NextResponse.json({
            billingCycleStart: user?.billingCycleStart || 1,
        });
    } catch (error) {
        console.error("Get settings error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT update user settings
export async function PUT(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { billingCycleStart } = body;

        // Validate billing cycle start (1-28)
        if (!billingCycleStart || billingCycleStart < 1 || billingCycleStart > 28) {
            return NextResponse.json(
                { error: "Tanggal awal bulan harus antara 1-28" },
                { status: 400 }
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { billingCycleStart },
            select: { billingCycleStart: true },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Update settings error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
