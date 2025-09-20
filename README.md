# Suanha Saigon 247 - Quotation Management System

A comprehensive quotation management system for maintenance companies, featuring multi-language support (Korean/Vietnamese) and role-based access control.

## Features

- **Multi-language Support**: Korean for administrators, Vietnamese for employees
- **Role-based Access**: Admin and Employee roles with different permissions
- **Customer Management**: Complete customer database with multiple addresses
- **Quotation Management**: Create, edit, and track quotations
- **Price Calculator**: Manage pricing categories and items (Admin only)
- **Account Management**: User management system (Admin only)
- **Dashboard**: Real-time statistics and recent activity

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- React 18 + TypeScript
- Vite for build tooling
- TailwindCSS for styling
- React Router for navigation
- Axios for API calls

## Project Structure

```
suanhasaigon247-manager/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth middleware
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── prisma/             # Database schema
│   └── package.json
├── frontend/               # Frontend React app
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── locales/        # i18n translations
│   └── package.json
└── docs/                   # Documentation
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file
DATABASE_URL="postgresql://username:password@localhost:5432/suanhasaigon247?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
```

4. Set up database:
```bash
npx prisma generate
npx prisma db push
```

5. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

## Usage

1. Access the application at `http://localhost:3000`
2. Login with admin credentials (create via API or database)
3. Switch between Korean (Admin) and Vietnamese (Employee) languages
4. Navigate through different sections based on your role

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Quotations
- `GET /api/quotations` - List quotations
- `POST /api/quotations` - Create quotation
- `PUT /api/quotations/:id` - Update quotation
- `DELETE /api/quotations/:id` - Delete quotation

### Price Management (Admin only)
- `GET /api/prices/categories` - List price categories
- `POST /api/prices/categories` - Create category
- `GET /api/prices/items` - List price items
- `POST /api/prices/items` - Create price item

### User Management (Admin only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## License

ISC
