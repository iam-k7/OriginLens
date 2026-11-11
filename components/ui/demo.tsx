import { AuthComponent } from "@/components/ui/sign-up";

const CustomLogo = () => (
  <div className="bg-orange-500 text-white rounded-md p-1.5 flex items-center justify-center">
    <svg 
      className="h-4 w-4" 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  </div>
);

export default function CustomAuthDemo() {
  return (
    <AuthComponent 
      logo={<CustomLogo />} 
      brandName="OriginLens" 
    />
  );
}
