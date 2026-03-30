import logo from '@/assets/logo.png';

const AppHeader = () => {
  return (
    <div className="flex items-center justify-center py-4 bg-background sticky top-0 z-50">
      <img
        src={logo}
        alt="Smarty Logbook"
        className="h-20 w-auto object-contain"
        style={{ mixBlendMode: 'multiply' }}
      />
    </div>
  );
};

export default AppHeader;
