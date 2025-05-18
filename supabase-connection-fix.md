# Supabase Connection Fix

There were two main issues causing the Supabase connection error:

## 1. Environment Variable Format Issue

The `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your `.env` file was broken across multiple lines, which can cause parsing issues. The key should be on a single line without any line breaks.

**Fix:** Edit the `.env` file to ensure the entire key is on a single line.

## 2. URL Format Issue

The code wasn't properly handling URLs that might be missing the `https://` prefix. This is important because:

1. Some environment variables might store just the domain part (`qxwutzfmlxdxoxbnjddq.supabase.co`)
2. Without the protocol, the browser would try to access it as a relative URL

**Fix:** Updated the `supabase.ts` file to automatically add the `https://` prefix if it's missing:

```typescript
export const supabase = createClient(
  supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`, 
  supabaseAnonKey
);
```

## Testing the Connection

After making these changes, restart your Next.js development server:

```
npm run dev
```

The Supabase connection should now work properly without the "ERR_NAME_NOT_RESOLVED" error. 