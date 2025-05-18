const fs = require('fs');

// The proper formatted environment variables
const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://qxwutzfmlxdxoxbnjddq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4d3V0emZtbHhkeG94Ym5qZGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MTY1MzUsImV4cCI6MjA2Mjk5MjUzNX0.kd_F0kSKwNuE5BTDBnIq4exCVacpVn-3znoP94WDY_4
`;

// Write to .env file
fs.writeFileSync('.env', envContent);
console.log('Environment file fixed!'); 