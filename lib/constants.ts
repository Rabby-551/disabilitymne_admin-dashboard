import {
  BarChart3,
  LineChart,
  CircleDollarSign,
  Crown,
  Dumbbell,
  Home,
  Images,
  MessageSquare,
  PackageOpen,
  Settings,
  Soup,
  Users,
  Wallet,
} from "lucide-react";



export const navItems = [
  { label: "Dashboard Overview", href: "/dashboard", icon: Home },
  { label: "User Management", href: "/user-management", icon: Users },
  { label: "Premium Users", href: "/premium-users", icon: Crown },
  { label: "Workout Program Library", href: "/premium-users/workout-library", icon: Dumbbell },
  { label: "Meal Program Library", href: "/premium-users/meal-library", icon: Soup },
  { label: "Homepage Banners", href: "/homepage-banners", icon: Images },
  { label: "Program Management", href: "/program-management", icon: PackageOpen },
  { label: "Exercise Library", href: "/exercise-library", icon: Dumbbell },
  { label: "Recipes Management", href: "/recipes-management", icon: Soup },
  { label: "Subscription Management", href: "/subscription-management", icon: Wallet },
  { label: "Revenue", href: "/revenue", icon: CircleDollarSign },
  { label: "Progress", href: "/progress", icon: LineChart },
  { label: "Feedback", href: "/feedback", icon: BarChart3 },
  { label: "Support", href: "/support", icon: MessageSquare },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

export const authRoutes = ["/login", "/forgot-password", "/verify-otp", "/reset-password"];
export const defaultProtectedRoute = "/dashboard";

export const CANONICAL_SUBSCRIPTION_PLANS = {
  monthly: {
    name: "Monthly Plan",
    price: 29.99,
    currency: "USD",
    durationLabel: "1 month",
    durationMonths: 1,
  },
  quarterly: {
    name: "Quarterly Plan",
    price: 149.99,
    currency: "USD",
    durationLabel: "3 months",
    durationMonths: 3,
  },
  annual: {
    name: "Annual Plan",
    price: 144,
    currency: "USD",
    durationLabel: "12 months",
    durationMonths: 12,
  },
  premium: {
    name: "Premium Plan",
    price: 199.99,
    currency: "USD",
    durationLabel: "1 month",
    durationMonths: 1,
  },
} as const;

export const planPriceFallback: Record<string, number> = {
  monthly: CANONICAL_SUBSCRIPTION_PLANS.monthly.price,
  quarterly: CANONICAL_SUBSCRIPTION_PLANS.quarterly.price,
  annual: CANONICAL_SUBSCRIPTION_PLANS.annual.price,
  premium: CANONICAL_SUBSCRIPTION_PLANS.premium.price,
};
