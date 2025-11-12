import { Contract, providers, utils } from 'ethers';
import type { Wallet } from 'ethers';

const USDC_ABI = ['function balanceOf(address owner) view returns (uint256)'];

export async function getUsdBalanceApprox(
  wallet: Wallet,
  usdcContractAddress: string,
): Promise<number> {
  const provider = wallet.provider;
  if (!provider) {
    throw new Error('Wallet provider is required');
  }
  const usdcContract = new Contract(usdcContractAddress, USDC_ABI, provider);
  const balance = await usdcContract.balanceOf(wallet.address);
  return parseFloat(utils.formatUnits(balance, 6));
}

