'use server'
import bcrypt from 'bcryptjs'
import { auth, signIn, signOut } from '@/auth'
import { IUserName, IUserSignIn, IUserSignUp } from '@/types'
import { UserSignUpSchema } from '../validator'
import { connectToDatabase } from '../db'
import { formatError } from '../utils'
import { redirect } from 'next/navigation'
import User from '@/lib/db/models/user.model';
import { generateResetToken } from '@/lib/utils';


export async function signInWithCredentials(user: IUserSignIn) {
    const response = signIn('credentials', { ...user, redirect: false })
    return response
}

export const SignOut = async () => {
    const redirectTo = await signOut({ redirect: false })
    redirect(redirectTo.redirect)
}
export const SignInWithGoogle = async () => {
    console.log(`Callback is working just fine`);
    await signIn('google');
}

export const checkUserExists = async (email: string) => {
    await connectToDatabase();

    const user = await User.findOne({ email });
    return !!user;
};



// CREATE
export async function registerUser(userSignUp: IUserSignUp) {
    try {
        const user = await UserSignUpSchema.parseAsync({
            name: userSignUp.name,
            email: userSignUp.email,
            password: userSignUp.password,
            confirmPassword: userSignUp.confirmPassword,
        })

        await connectToDatabase()
        await User.create({
            ...user,
            password: await bcrypt.hash(user.password, 5),
        })
        return { success: true, message: 'User created successfully' }
    } catch (error) {
        return { success: false, error: formatError(error) }
    }
}

export async function updateUserName(user: IUserName) {
    try {
        await connectToDatabase()
        const session = await auth();
        const currentUser = await User.findById(session?.user?.id);
        if (!currentUser) throw new Error('User not found')
        currentUser.name = user.name
        const updateUser = await currentUser.save();
        return {
            success: true,
            message: "User updated successfully",
            data: JSON.parse(JSON.stringify(updateUser)),
        }
    } catch (error) {
        return { success: false, message: formatError(error) }
    }
}
