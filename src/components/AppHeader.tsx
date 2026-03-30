import logo from '@/assets/logo-tight.png';

const AppHeader = () => {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-center bg-background py-0">
      <img
        src={logo}
        alt="Smarty Logbook"
        className="h-20 w-auto object-contain"
      />
    </div>
  );
};

export default AppHeader;
