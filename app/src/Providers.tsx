// Providers.tsx
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { NETWORK } from "./constants/config";


type ProvidersProps = {
  children: ReactNode; // ✅ children can be any valid JSX
};

export const Providers = ({ children }:ProvidersProps) => {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={NETWORK}  >
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
