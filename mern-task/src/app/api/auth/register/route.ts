import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { firstName, lastName, email, profilePicture, birthdate, phoneNumber, password } = body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    
    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      profilePicture,
      birthdate,
      phoneNumber,
      password
    });
    
    await user.save();
    
    // Return user without password
    const userWithoutPassword = { ...user.toObject() };
    delete userWithoutPassword.password;
    
    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}