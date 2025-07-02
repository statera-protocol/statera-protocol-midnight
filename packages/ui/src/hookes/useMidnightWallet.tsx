import { MidnightWalletContext } from '@/providers/MidnightWalletProvider'
import { useContext } from 'react'

const useMidnightWallet = () => {
const context = useContext(MidnightWalletContext)
if(!context){
    return;
}
  return context;
}

export default useMidnightWallet