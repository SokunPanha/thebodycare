// Auth: staff sign-in and the admin authorisation check.
// Public surface of this feature. Import from "@/features/auth", never a deep path. (STRUCTURE.md rule 2)
export { signIn, signOut } from "./actions";
export { LoginForm } from "./components/login-form";
export { getCurrentStaff, requireStaff, type Staff } from "./queries";
