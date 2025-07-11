
# TreasuryStream Wire Payment Dashboard

A comprehensive wire payment management application built for treasury operations, featuring automated payment processing, multi-contract allocation, and advanced financial reporting capabilities.

## 🚀 Features

### Core Payment Management
- **Automated Payment Clearing**: Smart matching system for expected vs actual payments
- **Multi-Contract Allocation**: Split payments across multiple contracts with percentage-based distribution
- **Manual Payment Posting**: Handle unknown payments with flexible contract assignment
- **Comprehensive Revert System**: Full audit trail with ability to revert processed payments

### Advanced Functionality
- **Real-time Dashboard**: Live payment status tracking and analytics
- **Advanced Filtering**: Multi-criteria search and filtering capabilities
- **Audit Trail**: Complete transaction history with user tracking
- **Professional UI**: Modern, responsive interface with TreasuryStream branding
- **Data Export**: Export payment data in various formats

### Payment Processing
- **Auto-clearing for matched payments**: Automatically process payments that match expected criteria
- **PTP (Pay to Pay) flag support**: Handle special payment types
- **GL Account integration**: Proper accounting integration
- **Backend transaction tracking**: Full integration with backend financial systems

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: Radix UI, Tailwind CSS, Framer Motion
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Charts & Analytics**: Plotly.js, Chart.js, Recharts
- **Form Handling**: React Hook Form with Zod validation
- **State Management**: Zustand, React Query

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Yarn package manager

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/treasurystream.git
cd treasurystream
```

### 2. Install dependencies
```bash
cd app
yarn install
```

### 3. Environment Setup
Copy the environment template and configure your variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/treasurystream"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Database Setup
```bash
# Generate Prisma client
yarn prisma generate

# Run database migrations
yarn prisma db push

# Seed the database with test data
yarn prisma db seed
```

### 5. Start the development server
```bash
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📊 Database Schema

The application uses a PostgreSQL database with the following main entities:

- **WirePayment**: Core payment records with status tracking
- **ContractAllocation**: Multi-contract payment distribution
- **AuditLog**: Complete audit trail for all operations
- **User**: User management and authentication

## 🧪 Testing

The application includes 25+ comprehensive test cases covering:

- Auto-clearing scenarios
- Multi-contract allocation
- Manual payment posting
- Revert functionality
- Edge cases and error handling

```bash
# Run tests
yarn test

# Run tests in watch mode
yarn test:watch
```

## 📝 Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn prisma:generate` - Generate Prisma client
- `yarn prisma:migrate` - Run database migrations
- `yarn prisma:seed` - Seed database with test data
- `yarn prisma:studio` - Open Prisma Studio

## 🏗 Project Structure

```
app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── dashboard/        # Dashboard-specific components
│   └── forms/            # Form components
├── lib/                  # Utility functions
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── scripts/              # Database seeding scripts
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |

### Database Configuration

The application uses Prisma ORM with PostgreSQL. The schema includes:

- Payment status tracking (PENDING, CLEARED, POSTED, REVERTED)
- Multi-contract allocation support
- Complete audit logging
- User authentication integration

## 🚀 Deployment

### Production Build
```bash
yarn build
yarn start
```

### Docker Deployment
```bash
# Build Docker image
docker build -t treasurystream .

# Run container
docker run -p 3000:3000 treasurystream
```

## 📈 Features in Detail

### Auto-Clearing System
- Matches incoming payments with expected payments
- Considers amount, date, and merchant criteria
- Automatically updates payment status
- Maintains complete audit trail

### Multi-Contract Allocation
- Split single payments across multiple contracts
- Percentage-based or fixed amount allocation
- Individual GL account assignment
- Separate transaction tracking per allocation

### Revert Functionality
- Complete payment reversal capability
- Preserves original payment data
- Updates all related allocations
- Maintains audit trail of reversals

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in the `/docs` folder

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

---

Built with ❤️ for treasury operations management.
