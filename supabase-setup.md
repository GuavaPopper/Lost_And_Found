# Supabase Setup Instructions

## Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# For storage (optional)
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=lost-and-found-images

# For authentication (optional)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Where to Find These Values

1. **NEXT_PUBLIC_SUPABASE_URL**: 
   - Go to your Supabase dashboard
   - Select your project
   - Click on "Settings" > "API"
   - Copy the URL under "Project URL"

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**:
   - Go to your Supabase dashboard
   - Select your project
   - Click on "Settings" > "API"
   - Copy the key under "anon/public" or "service_role" (use anon for client-side code)

## Starting the Development Server

After setting up the environment variables:

```bash
npm run dev
```

This will allow you to see the design and functionality of the Lost and Found application. 