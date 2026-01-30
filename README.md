# Smart Café Management System

A comprehensive web-based application for café operations including order processing, inventory management, and sales reporting.

## Features

- **Order Processing**: Efficiently manage and track customer orders in real-time
- **Menu Management**: Admin can add, edit, and manage menu items with pricing (in Philippine Peso)
- **Inventory Tracking**: Monitor stock levels with low-stock alerts
- **Sales Reports**: View daily and total revenue, order counts, and performance metrics
- **Role-Based Access**: Separate access levels for Admin/Owner and Staff with route protection
- **Authentication**: Secure login with automatic role-based redirects
- **Logout Functionality**: Secure logout button on all dashboard pages
- **Real-time Updates**: Powered by Supabase for instant data synchronization
- **Admin PIN Authorization**: Staff members require admin PIN to cancel/void orders
- **Multiple Payment Methods**: Support for Cash (with change calculator), GCash, and Maya
- **Receipt Printing**: Generate and print 80mm thermal receipts
- **Transaction History**: Complete audit trail with ingredient tracking
- **Automatic Inventory Deduction**: Ingredients auto-deduct when orders are completed

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Language**: TypeScript

## Color Palette

- **Forest**: `#214E34` - Primary color for headers and buttons
- **Cream**: `#F6D88B` - Accent color for highlights
- **Beige**: `#FBF6E9` - Background color
- **Olive**: `#3A5A40` - Secondary color for text and elements

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd smart-cafe-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Add your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:
   - Follow the instructions in `DATABASE_SETUP.md`
   - Run the SQL scripts in your Supabase SQL Editor

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## User Roles

### Admin/Owner
- Full access to all features
- Manage menu items
- View and manage inventory
- Access sales reports
- Manage staff accounts
- Process orders
- Cancel orders without PIN verification
- Set and manage admin PINs

### Staff
- Process customer orders
- View menu items
- Limited dashboard access
- **Require admin PIN to cancel/void orders** (security feature)

## Project Structure

```
smart-cafe-management-system/
├── app/
│   ├── dashboard/
│   │   ├── inventory/      # Inventory management
│   │   ├── menu/           # Menu management
│   │   ├── orders/         # Order processing
│   │   ├── reports/        # Sales reports
│   │   └── page.tsx        # Dashboard home
│   ├── login/              # Authentication
│   ├── globals.css         # Global styles with custom colors
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── lib/
│   ├── supabase/           # Supabase client configurations
│   │   ├── client.ts       # Browser client
│   │   ├── server.ts       # Server client
│   │   └── middleware.ts   # Auth middleware
│   ├── auth.ts             # Authentication utilities
│   └── constants.ts        # App constants
├── types/
│   └── database.types.ts   # TypeScript database types
├── middleware.ts           # Next.js middleware
└── DATABASE_SETUP.md       # Database setup instructions
```

## Database Schema

The system uses the following main tables:
- `users` - User accounts with roles
- `menu_items` - Café menu items
- `inventory` - Stock management
- `orders` - Customer orders
- `order_items` - Items within each order

See `DATABASE_SETUP.md` for complete schema and setup instructions.

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is licensed under the MIT License.
