export function AdminFooter() {
  return (
    <footer className="border-t bg-white px-6 py-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
        <p className="text-center sm:text-left">
          © {new Date().getFullYear()} <span className="font-semibold text-gray-700">WealthyBridge Admin</span>. All rights reserved.
        </p>
        <p className="text-center sm:text-right">
          Version <span className="font-mono font-medium text-gray-700">1.0.0</span>
        </p>
      </div>
    </footer>
  );
}
