import React, { useState, useMemo } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import {
  BookOpen,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  Wallet,
  CreditCard,
  ArrowRightLeft,
  PieChart,
  Target,
  CalendarClock,
  Repeat,
  TrendingUp,
  HandCoins,
  Building2,
  Smartphone,
  ShieldCheck,
  FileSpreadsheet,
  Trash2,
  Lock,
  CheckCircle2,
  Info,
  Lightbulb,
  AlertTriangle,
  Layers,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Upload,
  Database,
  Terminal,
  Mail,
  Send,
  Eye,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';

interface GuideStep {
  title: string;
  desc: string;
}

interface GuideItem {
  id: string;
  title: string;
  category: 'basics' | 'accounts' | 'transactions' | 'planning' | 'debts_loans' | 'tools';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tag: string;
  summary: string;
  whyItMatters: string;
  steps: GuideStep[];
  proTip?: string;
  example?: string;
  caution?: string;
}

interface FAQGuideSectionProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const FAQGuideSection: React.FC<FAQGuideSectionProps> = ({ isOpen = true, onClose }) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedGuideId, setExpandedGuideId] = useState<string | null>('fast-start');

  // Bug Report / Feature Request Form State
  const [ticketType, setTicketType] = useState<'bug' | 'feature' | 'feedback'>('bug');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [reproduceSteps, setReproduceSteps] = useState('');
  const [selectedEnvironment, setSelectedEnvironment] = useState('Production Web App');
  const [userEmail, setUserEmail] = useState('muhammadzabiulla786@gmail.com');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [imageError, setImageError] = useState(false);

  useScrollLock(isOpen);

  if (!isOpen) return null;

  const guideCategories = [
    { id: 'all', label: 'All Guides', icon: BookOpen },
    { id: 'basics', label: '1. Fast Start & Basics', icon: Sparkles },
    { id: 'accounts', label: '2. Accounts & Cards', icon: Wallet },
    { id: 'transactions', label: '3. Adding Transactions', icon: ArrowRightLeft },
    { id: 'planning', label: '4. Budgets & Goals', icon: Target },
    { id: 'debts_loans', label: '5. Debts, Loans & Udhar', icon: HandCoins },
    { id: 'tools', label: '6. Backup, Insights & Security', icon: ShieldCheck },
  ];

  const guideItems: GuideItem[] = [
    {
      id: 'fast-start',
      title: 'Quick Start: What is This App & The 3 Golden Rules',
      category: 'basics',
      icon: Sparkles,
      tag: 'Beginner Essential',
      summary: 'Learn what the app does in 60 seconds and master the 3 simple actions that keep your money completely organized.',
      whyItMatters: 'Managing money does not require math genius. Once you know these 3 simple rules, your net worth and cash balances will stay 100% accurate forever.',
      steps: [
        {
          title: 'Rule 1: When you spend money, log an EXPENSE',
          desc: 'Bought chai for ₹20, filled petrol for ₹500, or paid Amazon ₹1,200? Tap the green "+" button, choose Expense, pick your account or card, and save.',
        },
        {
          title: 'Rule 2: When you receive money, log an INCOME',
          desc: 'Salary credited, freelance earnings, bank interest, or a cashback reward? Tap "+", choose Income, pick the receiving bank account, and enter the amount.',
        },
        {
          title: 'Rule 3: Moving money between your own pockets is a TRANSFER',
          desc: 'Withdrew cash from an ATM, or moved money from HDFC to ICICI? This is NOT an expense. Choose Transfer. It decreases one account and increases the other, keeping your total net worth identical.',
        },
        {
          title: 'Understanding "Net Worth"',
          desc: 'Your Net Worth card on the Home screen is simply: (All Money You Own in Banks, Cash & Investments) MINUS (All Money You Owe on Credit Cards, Loans & Debts).',
        },
      ],
      proTip: 'You never have to enter your bank password or account number. Everything is 100% private and runs securely on your own device.',
      example: 'Start today by adding your primary bank account and entering your current balance as the opening balance.',
    },
    {
      id: 'home-dashboard',
      title: 'Home Dashboard: Understanding Your Financial Numbers',
      category: 'basics',
      icon: Layers,
      tag: 'Core Screen',
      summary: 'A complete tour of the main home screen: Net Worth card, Monthly Cash Flow, Budgets bar, and Quick Actions.',
      whyItMatters: 'The dashboard gives you complete financial clarity in 3 seconds every morning so you always know if you are saving money or overspending.',
      steps: [
        {
          title: '1. Net Worth Card',
          desc: 'Displays your overall financial strength. Tap the card to see a quick summary of total liquid bank assets versus outstanding credit card and loan liabilities.',
        },
        {
          title: '2. Monthly Cash Flow (Income vs. Expense)',
          desc: 'Shows how much green money entered this calendar month versus red money spent, alongside your Net Savings rate (e.g. +₹18,500 saved).',
        },
        {
          title: '3. Quick Action Bar',
          desc: 'Direct shortcuts to "Add Expense", "Add Income", or "Transfer" without navigating away from the dashboard.',
        },
        {
          title: '4. Active Budgets & Subscriptions Preview',
          desc: 'Shows budget progress bars for active spending categories and alerts you if any subscription renewal is due in the next 7 days.',
        },
        {
          title: '5. Recent Activity Ledger',
          desc: 'Chronological list of your latest transactions. Tap any row to inspect details or make quick corrections.',
        },
      ],
      proTip: 'Tap on the monthly cash flow card to immediately jump into deep charts and historical trend comparisons.',
    },
    {
      id: 'bank-accounts',
      title: 'Bank Accounts & Cash Wallets: How to Add & Manage',
      category: 'accounts',
      icon: Building2,
      tag: 'Accounts',
      summary: 'Step-by-step guide to setting up your Savings, Current, Salary accounts, Fixed Deposits, and physical Cash Wallet.',
      whyItMatters: 'Every transaction needs to come from or go into an account. Setting up your accounts accurately ensures your app balances match your actual bank statements.',
      steps: [
        {
          title: 'Step 1: Open the Accounts View',
          desc: 'Tap the "Accounts" tab in the bottom navigation bar.',
        },
        {
          title: 'Step 2: Tap "+ Add Account / Card"',
          desc: 'Select "Bank Account / Wallet" from the options prompt.',
        },
        {
          title: 'Step 3: Name & Choose Your Bank Institution',
          desc: 'Type an identifiable name (e.g. "HDFC Salary", "SBI Family", "Cash in Pocket"). Choose the institution logo (HDFC, SBI, ICICI, Axis, Kotak, PNB, etc.) to get authentic 3D emblems and colors.',
        },
        {
          title: 'Step 4: Enter Opening Balance',
          desc: 'Check your real bank app or count cash right now, and enter that exact balance as the "Opening Balance". From this moment forward, the app handles all the math automatically.',
        },
        {
          title: 'Step 5: Account Settings & Net Worth Toggle',
          desc: 'For emergency funds or special savings, you can keep them active. If you have an account you do not want counted in daily net worth, toggle "Exclude from Net Worth".',
        },
        {
          title: 'Step 6: Reorder or Convert',
          desc: 'Use the "Arrange Accounts" button to drag your most frequently used accounts to the very top. If you accidentally created an account as a card, tap "Convert to Credit Card" anytime.',
        },
      ],
      proTip: 'Always create a "Cash in Pocket" account with ₹500 or ₹1,000 opening balance. Whenever you withdraw from an ATM, record a Transfer from your Bank to Cash in Pocket!',
      example: 'HDFC Bank (₹45,200) + Cash Wallet (₹850) = Total Liquid Cash: ₹46,050.',
    },
    {
      id: 'credit-cards',
      title: 'Credit Cards & Card Decks: Tracking Bills & Outstanding',
      category: 'accounts',
      icon: CreditCard,
      tag: 'Credit Cards',
      summary: 'How credit card math works, setting billing cycles, tracking utilization, and paying card bills effortlessly.',
      whyItMatters: 'Credit cards are loans, not free money! Swiping a card increases your debt ("Outstanding Balance"). This app ensures you never miss a due date or exceed your credit limit.',
      steps: [
        {
          title: 'Step 1: Add a Credit Card',
          desc: 'In Accounts view, tap "+ Add Account / Card" and pick "Credit Card". Enter card name (e.g. "HDFC Millennia", "Axis Flipkart", "SBI Cashback").',
        },
        {
          title: 'Step 2: Enter Credit Limit & Statement Dates',
          desc: 'Enter your approved Credit Limit (e.g. ₹1,50,000). Set the Statement Date (the day the bill is generated, e.g. 15th) and Payment Due Date (e.g. 5th of next month).',
        },
        {
          title: 'Step 3: Choose a 3D Card Skin',
          desc: 'Choose from 30+ signature card visual skins (Signature Black, Titanium Metal, Gold Leaf, Cyberpunk Neon, Emerald Velvet) and enter the last 4 digits for easy identification.',
        },
        {
          title: 'Step 4: Swiping the Card (Expenses)',
          desc: 'When you buy something with your card, add an Expense and select your Credit Card. Note: Your bank balance does NOT decrease! Instead, your Card Outstanding increases.',
        },
        {
          title: 'Step 5: Paying Your Credit Card Bill (Card Payment)',
          desc: 'When you pay your monthly credit card bill: Tap "+", choose "Card Payment", pick the paying Bank Account, pick the Credit Card, and enter the bill amount. Your bank balance reduces and your card outstanding clears to ₹0!',
        },
      ],
      proTip: 'Keep your credit card utilization below 30% of your total limit to maintain a stellar CIBIL/credit score. The app card visual displays your current utilization percentage in real time.',
      caution: 'Do NOT log credit card bill payments as a normal "Expense", or your monthly expense total will be counted twice! Always use the dedicated "Card Payment" transaction type.',
    },
    {
      id: 'adding-transactions',
      title: 'Recording Transactions: Expenses, Income, Transfers & Refunds',
      category: 'transactions',
      icon: ArrowRightLeft,
      tag: 'Transactions',
      summary: 'Master every single transaction type in the app with step-by-step instructions and practical examples.',
      whyItMatters: 'Clean, accurate transactions give you reliable insights. The app supports 14 atomic transaction types with instant 5-second undo protection.',
      steps: [
        {
          title: '1. Adding an Expense',
          desc: 'Tap the "+" button. Enter amount -> Select Account or Credit Card used -> Pick Category (e.g. Food, Fuel, Shopping) -> Optional: Pick Payment App (Google Pay, PhonePe) -> Tap Save.',
        },
        {
          title: '2. Adding Income',
          desc: 'Tap "+" -> Switch type to "Income" -> Enter amount -> Choose destination Bank Account -> Pick Category (Salary, Bonus, Freelance, Gift) -> Tap Save.',
        },
        {
          title: '3. Making a Transfer',
          desc: 'Tap "+" -> Switch type to "Transfer" -> Select "From Account" (e.g. Bank) and "To Account" (e.g. Cash Wallet or another Bank) -> Enter amount -> Save.',
        },
        {
          title: '4. Recording a Refund',
          desc: 'Returned an item on Amazon or got a merchant reversal? Tap "+" -> Switch to "Refund" -> Select original account or credit card -> Enter refunded amount. This offsets your expense without inflating your regular income.',
        },
        {
          title: '5. Instant 5-Second Undo Protection',
          desc: 'Made a mistake or saved the wrong amount? A floating notification appears at the bottom with an "Undo" button for 5 seconds. Tap it to immediately revert the action.',
        },
      ],
      proTip: 'Use the Notes field to write quick keywords like "Dinner with Rahul" or "Car service 50k km". You can search these exact words anytime in the Transactions search bar!',
    },
    {
      id: 'search-and-filters',
      title: 'Searching, Filtering & Editing Past Transactions',
      category: 'transactions',
      icon: Search,
      tag: 'Ledger Tools',
      summary: 'Find any transaction in seconds by merchant name, date range, account, or category, and edit or delete records.',
      whyItMatters: 'When reconciling your monthly statements or checking how much you paid a specific vendor, smart search saves you hours of scrolling.',
      steps: [
        {
          title: '1. Instant Search Bar',
          desc: 'Go to the Transactions tab. Type any merchant name, category, note keyword, or amount in the top search box.',
        },
        {
          title: '2. Type Filter Pills',
          desc: 'Tap "All", "Expense", "Income", or "Transfer" pills to instantly narrow down your feed.',
        },
        {
          title: '3. Account & Card Filter Dropdown',
          desc: 'Select a specific bank account or credit card from the filter list to see only that account statement.',
        },
        {
          title: '4. Inspecting, Editing & Deleting',
          desc: 'Tap on any transaction row to open the Transaction Detail view. Tap "Edit" to modify amount/category/date, or tap "Delete" to move it to the Recycle Bin.',
        },
      ],
      proTip: 'Deleted something accidentally? Don\'t panic! It is safely preserved in the Recycle Bin (Trash) in the More tab where you can restore it with one click.',
    },
    {
      id: 'categories-and-emblems',
      title: 'Categories & 3D Custom Emblems: Personalizing Tags',
      category: 'planning',
      icon: PieChart,
      tag: 'Customization',
      summary: 'How to create custom spending categories, choose authentic bank emblems, and organize your spending taxonomy.',
      whyItMatters: 'Tailoring categories to your actual lifestyle (e.g. "Pet Care", "Baby Essentials", "Bike Maintenance") gives you actionable insight into where your money leaks.',
      steps: [
        {
          title: 'Step 1: Open Categories & Emblems Studio',
          desc: 'Go to More tab -> tap "Categories & Emblems".',
        },
        {
          title: 'Step 2: Browse Existing Categories',
          desc: 'Inspect pre-configured categories: Food & Dining, Groceries, Shopping, Utilities, Transportation, Entertainment, Health, Education, and more.',
        },
        {
          title: 'Step 3: Create a Custom Category',
          desc: 'Tap "+ Add Category". Type the name, pick whether it is for Expense or Income, select a vibrant color palette, and choose a matching vector icon.',
        },
        {
          title: 'Step 4: View Category-Specific Ledger',
          desc: 'Tap any category to view every historical transaction tagged with that category, along with total lifetime spend and monthly averages.',
        },
      ],
      proTip: 'Keep your categories focused (15-20 categories max). Avoid having too many overlapping categories like "Snacks", "Tea", and "Lunch"—combine them into "Food & Dining" for cleaner charts.',
    },
    {
      id: 'monthly-budgets',
      title: 'Monthly Budgets: Setting Spending Limits & Avoiding Debt',
      category: 'planning',
      icon: Target,
      tag: 'Budgeting',
      summary: 'Set spending caps for key categories (like Food, Shopping, or Fuel) and receive visual color-coded warnings before you overspend.',
      whyItMatters: 'Budgets are your financial seatbelt. Setting limits stops impulsive spending before it hurts your savings.',
      steps: [
        {
          title: 'Step 1: Navigate to Budgets',
          desc: 'Go to More tab -> tap "Monthly Budgets".',
        },
        {
          title: 'Step 2: Tap "+ Create Budget"',
          desc: 'Enter a budget title (e.g. "Dining & Takeout Limit", "Monthly Shopping Cap").',
        },
        {
          title: 'Step 3: Set Monthly Limit & Select Categories',
          desc: 'Enter your maximum monthly spend (e.g. ₹6,000). Check the categories that belong to this budget (e.g. Dining, Cafe, Food Delivery).',
        },
        {
          title: 'Step 4: Monitor Color-Coded Progress Bars',
          desc: 'The app automatically monitors every expense you log this month against this budget. Green = Safe (<70% spent), Amber = Warning (70-95% spent), Red = Over Budget (>100% exceeded!).',
        },
      ],
      proTip: 'Start by budgeting just your top 2 discretionary expense categories (usually Dining and Online Shopping). You will be amazed how quickly you save ₹5,000 - ₹10,000 every month!',
      example: 'Budget: Dining Out (₹5,000). Spent so far: ₹3,200. Remaining: ₹1,800 for the rest of the month.',
    },
    {
      id: 'savings-goals',
      title: 'Savings Goals: Saving for Vacations, Emergency Funds & Big Buys',
      category: 'planning',
      icon: TrendingUp,
      tag: 'Goals',
      summary: 'Define financial dreams with target amounts, track progress percentages, allocate funds, and celebrate milestones.',
      whyItMatters: 'Saving without a specific goal feels like a chore. Giving your savings a name and target date turns saving money into a rewarding game.',
      steps: [
        {
          title: 'Step 1: Open Savings Goals',
          desc: 'Go to More tab -> tap "Savings Goals".',
        },
        {
          title: 'Step 2: Create a New Goal',
          desc: 'Tap "+ New Goal". Name your goal (e.g. "6-Month Emergency Fund", "Japan Vacation", "New Motorcycle", "Diwali Gifts").',
        },
        {
          title: 'Step 3: Set Target Amount & Date',
          desc: 'Enter how much you need (e.g. ₹1,20,000) and your target completion date.',
        },
        {
          title: 'Step 4: Deposit / Allocate Money',
          desc: 'Whenever you save money, tap "Allocate Funds" on your goal card. Enter the deposit amount. The app updates your progress percentage in real time.',
        },
        {
          title: 'Step 5: Milestone Celebration',
          desc: 'When your goal hits 100%, enjoy an interactive confetti celebration! You can mark the goal as completed or keep it as an active reserve.',
        },
      ],
      proTip: 'Make an "Emergency Fund" your very first goal, aiming for 3 to 6 months of living expenses. It provides unmatched peace of mind.',
    },
    {
      id: 'subscriptions',
      title: 'Subscriptions: Never Get Surprised by Auto-Debits',
      category: 'planning',
      icon: CalendarClock,
      tag: 'Subscriptions',
      summary: 'Track recurring entertainment, gym, and software subscriptions with renewal dates, monthly cost averages, and cancel reminders.',
      whyItMatters: 'Unused recurring subscriptions bleed thousands of rupees silently every year. Tracking them in one list makes it effortless to cancel what you no longer watch or use.',
      steps: [
        {
          title: 'Step 1: Open Subscriptions Manager',
          desc: 'Go to More tab -> tap "Subscriptions".',
        },
        {
          title: 'Step 2: Tap "+ Add Subscription"',
          desc: 'Pick from popular pre-configured brand logos (Netflix, Spotify, Amazon Prime, YouTube Premium, Disney+ Hotstar, iCloud, Gym, Broadband) or enter a custom name.',
        },
        {
          title: 'Step 3: Set Cost & Billing Frequency',
          desc: 'Enter the cost (e.g. ₹649) and billing cycle (Monthly, Quarterly, or Yearly). The app automatically computes your normalized monthly and yearly cost.',
        },
        {
          title: 'Step 4: Set Next Renewal Date',
          desc: 'Choose the next charge date. The app shows an alert badge when renewal is coming up in the next 7 days so you have time to cancel or ensure sufficient bank balance.',
        },
      ],
      proTip: 'Review this list once every 3 months. If you haven\'t watched a streaming service in the past 30 days, pause or cancel it immediately!',
    },
    {
      id: 'recurring-payments',
      title: 'Automated Recurring Payments: Set It and Forget It',
      category: 'planning',
      icon: Repeat,
      tag: 'Automation',
      summary: 'Set up automated recurring transactions for house rent, monthly salary, SIP deductions, and maid/cook charges.',
      whyItMatters: 'You shouldn\'t have to manually log your rent or salary every single month. The recurring engine automatically logs them on the exact due date.',
      steps: [
        {
          title: 'Step 1: Open Recurring Payments',
          desc: 'Go to More tab -> tap "Recurring Payments".',
        },
        {
          title: 'Step 2: Tap "+ Add Schedule"',
          desc: 'Choose transaction type (Expense or Income). Enter amount, account, and category (e.g. House Rent ₹22,000 from HDFC Bank).',
        },
        {
          title: 'Step 3: Set Frequency & Start Date',
          desc: 'Select how often it repeats: Daily, Weekly, Monthly, Quarterly, Half-Yearly, or Yearly. Set the next due date.',
        },
        {
          title: 'Step 4: Automatic Execution',
          desc: 'Whenever you open the app on or after the scheduled date, the app checks all pending recurring rules and logs the transaction for you automatically.',
        },
      ],
      proTip: 'Set your salary as a Monthly recurring income on the 1st or last working day of the month so your income is always up to date.',
    },
    {
      id: 'lent-and-borrowed',
      title: 'Money Lent & Borrowed (Udhar): Track Who Owes You & Who You Owe',
      category: 'debts_loans',
      icon: HandCoins,
      tag: 'Debts & Udhar',
      summary: 'Track informal loans between friends, family, and colleagues. Record partial repayments, remaining balances, and settlements.',
      whyItMatters: 'Forgetting who owes you money causes awkwardness and lost savings. This tool tracks every rupee lent or borrowed with zero confusion.',
      steps: [
        {
          title: '1. Lent Money (Receivable — They Owe You)',
          desc: 'Paid for a friend\'s dinner or lent money to a relative? Open "Lent & Borrowed" -> tap "+ Add Record" -> select "Money Lent" -> enter their name, amount, and due date.',
        },
        {
          title: '2. Borrowed Money (Payable — You Owe Them)',
          desc: 'Borrowed cash from a colleague? Add a record as "Money Borrowed" to ensure you pay them back on time.',
        },
        {
          title: '3. Recording Repayments (Partial or Full)',
          desc: 'When they return ₹500 of a ₹2,000 debt: Tap on the record -> tap "Record Repayment" -> enter ₹500. The app automatically updates the remaining balance to ₹1,500 and adjusts your bank account balance!',
        },
        {
          title: '4. Marking as Fully Settled',
          desc: 'Once the balance reaches ₹0, the record automatically moves to the "Settled" tab with a green checkmark.',
        },
      ],
      proTip: 'Never feel awkward following up on lent money again. You can view the exact date, initial amount, and remaining balance at a glance.',
      example: 'Lent to Vikram: ₹5,000. Vikram paid back ₹3,000 on Friday. Remaining balance: ₹2,000.',
    },
    {
      id: 'loans-and-emis',
      title: 'Loans & EMIs: Home, Car, Personal & Education Loans',
      category: 'debts_loans',
      icon: Building2,
      tag: 'Formal Loans',
      summary: 'Manage bank loans, track principal balances, interest rates, monthly EMI amounts, and log loan repayments.',
      whyItMatters: 'Loans are major financial liabilities. Tracking your principal paydown keeps you motivated to pre-pay loans and become debt-free faster.',
      steps: [
        {
          title: 'Step 1: Open Loans & EMIs',
          desc: 'Go to More tab -> tap "Loans & EMIs".',
        },
        {
          title: 'Step 2: Add a Loan Record',
          desc: 'Tap "+ Add Loan". Select loan type (Home Loan, Car Loan, Personal Loan, Education Loan).',
        },
        {
          title: 'Step 3: Enter Loan Details',
          desc: 'Enter Lending Bank (SBI, HDFC, ICICI, etc.), Original Principal Amount (e.g. ₹25,00,000), Current Remaining Principal, Annual Interest Rate (%), and Monthly EMI amount.',
        },
        {
          title: 'Step 4: Logging Monthly EMI Repayments',
          desc: 'When your monthly EMI debits from your bank account, log it as a "Loan Repayment" transaction. The app automatically deducts the EMI from your bank balance and reduces your remaining loan principal.',
        },
      ],
      proTip: 'Whenever you make a lump-sum prepayment towards your loan principal, log it as a Loan Repayment to see your total debt shrink immediately.',
    },
    {
      id: 'investments',
      title: 'Investment Portfolio: Tracking Mutual Funds, Stocks & Gold',
      category: 'planning',
      icon: TrendingUp,
      tag: 'Investments',
      summary: 'Track Mutual Funds (SIPs), Stocks, Fixed Deposits, PPF, NPS, Sovereign Gold Bonds, Real Estate, and Crypto in one unified portfolio.',
      whyItMatters: 'Seeing your total invested wealth alongside your daily cash balances gives you a true, complete picture of your growing financial freedom.',
      steps: [
        {
          title: 'Step 1: Open Investments',
          desc: 'Go to More tab -> tap "Investments".',
        },
        {
          title: 'Step 2: Add an Asset',
          desc: 'Tap "+ Add Investment". Choose the Asset Class (Mutual Funds, Stocks, Fixed Deposit, PPF, Gold, Real Estate, Crypto).',
        },
        {
          title: 'Step 3: Enter Invested Amount & Current Market Value',
          desc: 'Enter total money invested (e.g. ₹50,000) and current portfolio value (e.g. ₹58,400). The app automatically calculates your Profit/Loss (+₹8,400) and Absolute Return percentage (+16.8%).',
        },
        {
          title: 'Step 4: Periodic Updates',
          desc: 'Once a month, check your Zerodha, Groww, or bank statement and update the "Current Value" to keep your Net Worth chart perfectly accurate.',
        },
      ],
      proTip: 'Investments are automatically classified as assets and contribute directly to your Net Worth calculation on the home dashboard.',
    },
    {
      id: 'payment-apps-upi',
      title: 'Payment Apps & UPI Channels: Linking Google Pay, PhonePe & Paytm',
      category: 'tools',
      icon: Smartphone,
      tag: 'Payment Apps',
      summary: 'Configure your favorite UPI apps and wallets so you can tag payment channels and analyze which app handles most of your spending.',
      whyItMatters: 'Most spending today happens over UPI. Tagging the payment app lets you verify transactions against your Google Pay or PhonePe passbooks in seconds.',
      steps: [
        {
          title: 'Step 1: Open Payment Apps Manager',
          desc: 'Go to More tab -> tap "Payment Apps".',
        },
        {
          title: 'Step 2: Enable Active Apps',
          desc: 'Toggle on the payment apps you use: Google Pay, PhonePe, Paytm, CRED, Amazon Pay, BHIM UPI, Netbanking, or Cash.',
        },
        {
          title: 'Step 3: Tagging When Adding Transactions',
          desc: 'When logging any expense or transfer, tap the "Payment Channel" icon to tag the app used.',
        },
        {
          title: 'Step 4: View Channel Analytics',
          desc: 'In Insights, inspect the Payment Channel Breakdown chart to see what percentage of your spending travels through UPI versus physical cards.',
        },
      ],
      proTip: 'Tagging your payment app helps you quickly find discrepancies when reconciling with your monthly bank SMS alerts.',
    },
    {
      id: 'insights-and-charts',
      title: 'Visual Insights & Analytics: Visualizing Where Your Money Goes',
      category: 'tools',
      icon: PieChart,
      tag: 'Analytics',
      summary: 'How to read the spending pie chart, cash flow comparison bars, daily spending trends, and payment channel breakdowns.',
      whyItMatters: 'A visual chart reveals bad spending habits in one second that spreadsheets hide for months. Spot spikes, cut waste, and boost your savings rate.',
      steps: [
        {
          title: '1. Accessing Insights',
          desc: 'Tap the "Insights" tab or tap the Cashflow card on the Home screen.',
        },
        {
          title: '2. Category Spending Pie Chart',
          desc: 'Tap on any slice to see total rupees spent and percentage of total expenses. High percentages on Dining or Shopping immediately stand out.',
        },
        {
          title: '3. Cashflow Comparison Chart',
          desc: 'Compares your total monthly income against monthly expenses. If the green bar is consistently taller than the red bar, you are building wealth!',
        },
        {
          title: '4. Daily Spend Trend Chart',
          desc: 'Identifies which days of the week or month your spending spikes (e.g. weekend splurges or bill payment days).',
        },
      ],
      proTip: 'Review your Insights view every Sunday evening to see if you stayed on track for the week.',
    },
    {
      id: 'backup-excel-cashew',
      title: 'Data Backup, Excel/CSV Export & Cashew App Migration',
      category: 'tools',
      icon: FileSpreadsheet,
      tag: 'Data Ownership',
      summary: 'Export formatted multi-sheet Excel workbooks, download JSON backups, restore data, and migrate from the Cashew mobile app.',
      whyItMatters: 'Your financial data is 100% yours. You can export everything to Excel at any time, or migrate all past years of data from the Cashew app with one click.',
      steps: [
        {
          title: '1. Exporting to Microsoft Excel (.xlsx)',
          desc: 'Go to More tab -> tap "Export & Backup Data" -> select "Excel Workbook (.xlsx)". Download a master spreadsheet with dedicated, auto-styled sheets for Transactions, Accounts, Cards, Budgets, and Loans.',
        },
        {
          title: '2. Creating a 1-Click JSON Backup',
          desc: 'In "Export & Backup Data", tap "JSON Backup File". Save this file to Google Drive or your computer. If you ever switch phones or browsers, tap "Restore Backup" to bring all your data back instantly.',
        },
        {
          title: '3. Migrating from Cashew Personal Finance App',
          desc: 'Used Cashew on Android/iOS before? Go to More tab -> tap "Import from Cashew App". Upload your .cashew or SQLite database backup. The built-in WebAssembly SQLite engine automatically parses your wallets, categories, and full transaction history with zero data loss!',
        },
      ],
      proTip: 'We recommend downloading an Excel or JSON backup at the end of every month and saving it to your personal cloud drive.',
    },
    {
      id: 'security-and-pin',
      title: 'Security, 4-Digit PIN Lock & Complete Privacy',
      category: 'tools',
      icon: Lock,
      tag: 'Privacy & Security',
      summary: 'How the 4-digit PIN lock works, offline-first security, and why your data is completely safe from prying eyes.',
      whyItMatters: 'Your financial transactions are private. Enabling the PIN lock prevents friends or family from peeking into your balances when handling your phone.',
      steps: [
        {
          title: 'Step 1: Enabling App Lock',
          desc: 'In the More tab, scroll to the "Security & PIN Lock" section. Toggle the switch to ON.',
        },
        {
          title: 'Step 2: Setting Your 4-Digit Passcode',
          desc: 'Enter a secure 4-digit PIN (e.g. 2468) and confirm it. From now on, whenever you open the app or tap the lock button in the top bar, the app requires your PIN.',
        },
        {
          title: 'Step 3: Instant Quick-Lock',
          desc: 'Handing your phone to a colleague? Tap the Lock icon in the top header bar to lock the app immediately with one tap.',
        },
        {
          title: 'Step 4: Offline-First Architecture',
          desc: 'All your accounts, notes, and transactions are stored directly in your device\'s local storage. No advertising trackers, no third-party sales, and no bank credential requests.',
        },
      ],
      proTip: 'Write down your PIN in a secure notes app so you do not forget it.',
      caution: 'Do not use obvious PINs like 1234 or 0000.',
    },
    {
      id: 'trash-and-audit',
      title: 'Recycle Bin (Trash) & Forensic Activity Audit Log',
      category: 'tools',
      icon: Trash2,
      tag: 'Safety Net',
      summary: 'How to recover accidentally deleted accounts or transactions, and inspect the timestamped audit log of every change made.',
      whyItMatters: 'Accidents happen. You never have to worry about permanently losing data by a wrong click—the Recycle Bin keeps your deleted items safe until you choose to empty it.',
      steps: [
        {
          title: '1. Accessing the Recycle Bin (Trash)',
          desc: 'Go to More tab -> tap "Recycle Bin (Trash)". Here you will find all soft-deleted transactions, accounts, and cards.',
        },
        {
          title: '2. Restoring an Item',
          desc: 'Tap the green "Restore" button on any deleted item. It immediately returns to your active accounts or transaction feed with its balances restored!',
        },
        {
          title: '3. Permanently Emptying Trash',
          desc: 'When you are confident you no longer need the deleted items, tap "Empty Trash" to permanently remove them.',
        },
        {
          title: '4. Activity Audit Log',
          desc: 'Tap "Activity Audit Log" in the More tab to see an immutable forensic timeline of every addition, edit, deletion, or backup action with exact date, time, and field differences.',
        },
      ],
      proTip: 'The Activity Audit Log is invaluable if you ever wonder "Who changed this balance?" or "When did I edit this transaction?".',
    },
  ];

  // Filtered Guides
  const filteredGuides = useMemo(() => {
    return guideItems.filter(guide => {
      const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        guide.title.toLowerCase().includes(query) ||
        guide.summary.toLowerCase().includes(query) ||
        guide.tag.toLowerCase().includes(query) ||
        guide.steps.some(s => s.title.toLowerCase().includes(query) || s.desc.toLowerCase().includes(query)) ||
        (guide.proTip && guide.proTip.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const toggleGuide = (id: string) => {
    setExpandedGuideId(prev => (prev === id ? null : id));
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();

    const recipient = 'muhammadzabiulla786@gmail.com';
    const subjectLine = `[Money Tracker - ${ticketType.toUpperCase()}] ${ticketSubject || 'User Inquiry'}`;

    let bodyText = `Type: ${ticketType.toUpperCase()}\n`;
    bodyText += `Environment: ${selectedEnvironment}\n`;
    bodyText += `Sender: ${userEmail}\n\n`;
    bodyText += `Description:\n${ticketDescription || 'No description provided.'}\n\n`;
    if (ticketType === 'bug' && reproduceSteps) {
      bodyText += `Steps to Reproduce:\n${reproduceSteps}\n\n`;
    }
    bodyText += `--- \nSent from Money Tracker user guide portal.`;

    const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(bodyText)}`;
    window.location.href = mailtoUrl;

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 5000);
  };

  return (
    <div className="space-y-8" id="app-complete-guide">
      {/* 1. Header Banner */}
      <div className="p-6 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 rounded-3xl text-white shadow-lg space-y-4 relative overflow-hidden">
        <div className="absolute right-0 -bottom-10 w-48 h-48 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-emerald-200 text-[11px] font-extrabold tracking-wider uppercase">
              <BookOpen size={14} className="text-emerald-300" />
              <span>Comprehensive Handbook & User Manual</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Every Feature Explained Step-by-Step
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
              New to Money Tracker? Don't worry! Follow these simple step-by-step guides to master your bank accounts, credit cards, daily transactions, budgets, and savings.
            </p>
          </div>
          <div className="shrink-0 flex items-center space-x-2">
            <div className="px-4 py-2.5 bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 text-center">
              <span className="block text-lg font-black text-emerald-300">{guideItems.length}</span>
              <span className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">Total Guides</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative pt-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search any feature (e.g., 'Add Expense', 'Credit Card', 'Budget', 'Lent Money', 'Backup')..."
              className="w-full pl-10 pr-4 py-3 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white rounded-2xl text-xs sm:text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-md transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 px-2 py-0.5 text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold hover:bg-slate-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Category Quick Filters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Browse Guides by Category
          </span>
          <button
            onClick={() => {
              if (expandedGuideId) {
                setExpandedGuideId(null);
              } else {
                setExpandedGuideId(filteredGuides[0]?.id || null);
              }
            }}
            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            {expandedGuideId ? 'Collapse Open Guide' : 'Expand Top Guide'}
          </button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {guideCategories.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap flex items-center space-x-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Icon size={14} className={isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Guide Cards Feed */}
      <div className="space-y-4">
        {filteredGuides.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Search size={22} />
            </div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">No Guides Found for "{searchQuery}"</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Try searching for general keywords like "Card", "Expense", "Income", "Goal", or clear your filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Reset Search & Filters
            </button>
          </div>
        ) : (
          filteredGuides.map((guide, idx) => {
            const isExpanded = expandedGuideId === guide.id;
            const Icon = guide.icon;

            return (
              <div
                key={guide.id}
                id={`guide-${guide.id}`}
                className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'bg-white dark:bg-slate-900 border-emerald-500/50 dark:border-emerald-500/40 shadow-lg'
                    : 'bg-white dark:bg-slate-900/60 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                {/* Header / Clickable Toggle */}
                <button
                  type="button"
                  onClick={() => toggleGuide(guide.id)}
                  className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                        isExpanded
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100'
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {guide.tag}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                          Guide #{idx + 1}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {guide.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {guide.summary}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                      isExpanded
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                    }`}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {/* Expanded Content Body */}
                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-5 animate-in fade-in duration-200">
                    {/* Why It Matters Callout */}
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50 flex items-start space-x-3 text-xs text-emerald-900 dark:text-emerald-200">
                      <Info size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold block text-emerald-950 dark:text-emerald-300 mb-0.5">
                          Why this feature is important:
                        </span>
                        {guide.whyItMatters}
                      </div>
                    </div>

                    {/* Step-by-Step Instructions */}
                    <div className="space-y-3">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                        Step-by-Step Instructions
                      </span>
                      <div className="grid grid-cols-1 gap-2.5">
                        {guide.steps.map((step, stepIdx) => (
                          <div
                            key={stepIdx}
                            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start space-x-3"
                          >
                            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {stepIdx + 1}
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                                {step.title}
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                                {step.desc}
                              </p>
                              {/* Rich Visual UI Mockup Preview Card */}
                              <div className="mt-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  <span>Live UI Preview • Step {stepIdx + 1}</span>
                                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Interactive Mockup
                                  </span>
                                </div>
                                {guide.id === 'fast-start' && stepIdx === 0 && (
                                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs">
                                    <div className="flex items-center space-x-2">
                                      <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">🍔</span>
                                      <div>
                                        <span className="font-black text-slate-900 dark:text-white block">Expense: Food & Dining</span>
                                        <span className="text-[10px] text-slate-500">Paid via HDFC Bank</span>
                                      </div>
                                    </div>
                                    <span className="font-mono font-black text-rose-600 dark:text-rose-400">-₹350.00</span>
                                  </div>
                                )}
                                {guide.id === 'fast-start' && stepIdx === 1 && (
                                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between text-xs">
                                    <div className="flex items-center space-x-2">
                                      <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">💼</span>
                                      <div>
                                        <span className="font-black text-slate-900 dark:text-white block">Income: Salary Credited</span>
                                        <span className="text-[10px] text-slate-500">Received in SBI Account</span>
                                      </div>
                                    </div>
                                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">+₹45,000.00</span>
                                  </div>
                                )}
                                {guide.id === 'fast-start' && stepIdx === 2 && (
                                  <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 flex items-center justify-between text-xs">
                                    <div className="flex items-center space-x-2">
                                      <span className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">🔄</span>
                                      <div>
                                        <span className="font-black text-slate-900 dark:text-white block">Transfer: ATM Cash Withdrawal</span>
                                        <span className="text-[10px] text-slate-500">HDFC Bank ➔ Cash in Pocket</span>
                                      </div>
                                    </div>
                                    <span className="font-mono font-black text-purple-600 dark:text-purple-400">₹5,000.00</span>
                                  </div>
                                )}
                                {guide.id === 'fast-start' && stepIdx >= 3 && (
                                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 text-center font-bold">
                                    📊 Net Worth = Assets (₹2,50,000) − Liabilities (₹35,000) = ₹2,15,000
                                  </div>
                                )}

                                {guide.id === 'bank-accounts' && (
                                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between text-xs">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">🏦</div>
                                      <div>
                                        <span className="font-black text-slate-900 dark:text-white block">HDFC Salary Account</span>
                                        <span className="text-[10px] text-slate-500">Opening Balance Set</span>
                                      </div>
                                    </div>
                                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">₹45,200.00</span>
                                  </div>
                                )}

                                {guide.id === 'credit-cards' && (
                                  <div className="p-2.5 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-6 h-6 rounded bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-bold text-[10px] flex items-center justify-center">VISA</div>
                                      <div>
                                        <span className="font-black text-white block">HDFC Millennia (•••• 4092)</span>
                                        <span className="text-[10px] text-slate-300">Limit: ₹1,50,000</span>
                                      </div>
                                    </div>
                                    <span className="font-mono text-xs font-bold text-amber-400">Due: 5th</span>
                                  </div>
                                )}

                                {guide.id === 'adding-transactions' && (
                                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs">
                                    <div className="flex items-center space-x-2">
                                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">✓</span>
                                      <span className="font-black text-slate-900 dark:text-white">Transaction Successfully Recorded</span>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">Undo Available (5s)</span>
                                  </div>
                                )}

                                {guide.id !== 'fast-start' && guide.id !== 'bank-accounts' && guide.id !== 'credit-cards' && guide.id !== 'adding-transactions' && (
                                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                    <span className="font-medium">Step {stepIdx + 1} Action Executed Successfully</span>
                                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">Verified UI</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pro Tip & Example Callouts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {guide.proTip && (
                        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 flex items-start space-x-2.5 text-xs text-amber-900 dark:text-amber-200">
                          <Lightbulb size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-black block text-amber-950 dark:text-amber-300 mb-0.5">
                              💡 Pro Tip
                            </span>
                            {guide.proTip}
                          </div>
                        </div>
                      )}

                      {guide.example && (
                        <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-900/50 flex items-start space-x-2.5 text-xs text-sky-900 dark:text-sky-200">
                          <CheckCircle2 size={16} className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-black block text-sky-950 dark:text-sky-300 mb-0.5">
                              Real-World Example
                            </span>
                            {guide.example}
                          </div>
                        </div>
                      )}

                      {guide.caution && (
                        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 flex items-start space-x-2.5 text-xs text-rose-900 dark:text-rose-200 sm:col-span-2">
                          <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-black block text-rose-950 dark:text-rose-300 mb-0.5">
                              ⚠️ Watch Out / Important Note
                            </span>
                            {guide.caution}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. Developer Profile & Bug / Feature Request Portal */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6" id="developer-support-hub">
        <div className="flex flex-col space-y-1 px-1">
          <div className="flex items-center space-x-2">
            <Terminal className="text-emerald-500" size={20} />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Need Personal Help? Contact Lead Architect
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Have a question, encountered a bug, or want a custom feature added to the app? Submit feedback directly to the lead architect.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Developer Profile Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 bg-gradient-to-tr from-slate-900 to-slate-850 dark:from-slate-950 dark:to-slate-900 text-white rounded-3xl space-y-4 relative overflow-hidden shadow-sm border border-slate-800">
              <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>

              <div className="flex items-center space-x-3.5 relative z-10">
                <div className="w-12 h-12 rounded-2xl border border-emerald-500/30 overflow-hidden flex items-center justify-center bg-slate-800 shadow-sm shrink-0">
                  {!imageError ? (
                    <img
                      src="/Mohammed_Zabiulla_PP_Size_March_2026.jpg"
                      alt="Mohammed Saqlain"
                      referrerPolicy="no-referrer"
                      onError={() => {
                        console.log("Developer portrait not found in public/ directory, falling back to styled initials.");
                        setImageError(true);
                      }}
                      className="w-full h-full object-cover object-[center_15%]"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-xs tracking-wider">
                      MS
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">Lead Architect</h4>
                  <p className="text-sm font-extrabold text-white mt-0.5">Mohammed Saqlain</p>
                  <p className="text-[10px] text-slate-400">Full-Stack Sovereign Architect</p>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-800 text-[11px] text-slate-300">
                <div className="flex items-center space-x-2">
                  <Mail size={12} className="text-emerald-400" />
                  <span>muhammadzabiulla786@gmail.com</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-400 text-[10px]">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  <span>Private, Offline-First & No Third-Party Tracking</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Email Dispatch Form */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-850 space-y-4 shadow-xs">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              Support & Feature Dispatch
            </span>

            <form onSubmit={handleSendEmail} className="space-y-3.5">
              {/* Type Select */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTicketType('bug')}
                  className={`py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                    ticketType === 'bug'
                      ? 'bg-rose-500/10 border-rose-500 text-rose-500'
                      : 'bg-slate-50 dark:bg-slate-950 border-transparent text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <AlertTriangle size={12} className="inline mr-1" /> Bug Report
                </button>
                <button
                  type="button"
                  onClick={() => setTicketType('feature')}
                  className={`py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                    ticketType === 'feature'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                      : 'bg-slate-50 dark:bg-slate-950 border-transparent text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Lightbulb size={12} className="inline mr-1" /> New Feature
                </button>
                <button
                  type="button"
                  onClick={() => setTicketType('feedback')}
                  className={`py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                    ticketType === 'feedback'
                      ? 'bg-sky-500/10 border-sky-500 text-sky-500'
                      : 'bg-slate-50 dark:bg-slate-950 border-transparent text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Send size={12} className="inline mr-1" /> Ask Question
                </button>
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Ticket Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., How do I add my HDFC credit card statement date?"
                  value={ticketSubject}
                  onChange={e => setTicketSubject(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Environment / Platform */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Environment
                  </label>
                  <select
                    value={selectedEnvironment}
                    onChange={e => setSelectedEnvironment(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                  >
                    <option value="Production Web App">Production Web App</option>
                    <option value="Mobile Browser PWA">Mobile Browser PWA</option>
                    <option value="Desktop Browser">Desktop Browser</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Your Email
                  </label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={e => setUserEmail(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Detailed Description
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your question or issue in detail..."
                  value={ticketDescription}
                  onChange={e => setTicketDescription(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              {/* Reproduce Steps (Only for bugs) */}
              {ticketType === 'bug' && (
                <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-[9px] font-black text-rose-400 uppercase tracking-wider">
                    Steps to Reproduce
                  </label>
                  <textarea
                    rows={2}
                    placeholder="1. Open Accounts tab&#10;2. Click Add Card...&#10;3. See what happened"
                    value={reproduceSteps}
                    onChange={e => setReproduceSteps(e.target.value)}
                    className="w-full text-xs font-medium p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all resize-none"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center space-x-2 shadow-xs cursor-pointer active:scale-[0.98] transition-all"
              >
                <Mail size={14} />
                <span>Dispatch Email Inquiry</span>
              </button>
            </form>

            {/* Success Toast */}
            {showSuccessToast && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-center space-x-2 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in duration-200">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>Redirecting you to your email client to dispatch your message!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
