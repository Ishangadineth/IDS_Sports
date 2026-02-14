import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(req: Request) {
    try {
        await dbConnect();

        // Looking for the user 'admin' (the moderator one you want to delete)
        const usernameToDelete = 'admin';

        const deletedUser = await User.findOneAndDelete({ username: usernameToDelete });

        if (!deletedUser) {
            return NextResponse.json({ message: `User '${usernameToDelete}' not found.` }, { status: 404 });
        }

        return NextResponse.json({
            message: `User '${usernameToDelete}' deleted successfully.`,
            deletedUser: {
                username: deletedUser.username,
                role: deletedUser.role
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
