import logo from '@/assets/logo-tight.png';

const AppHeader = () => {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-center bg-background pt-4 pb-0">
      <img
        src={logo}
        alt="SmartBee Logbook"
        className="h-12 w-auto object-contain"
      />
    </div>
  );
};

export default AppHeader;
