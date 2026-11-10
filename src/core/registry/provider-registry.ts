import {
  ProviderAlreadyRegisteredError,
  ProviderNotFoundError,
} from "../errors/concurrency.errors.js";

export class ProviderRegistry<TProvider> {
  private readonly providers = new Map<string, TProvider>();

  register(name: string, provider: TProvider): void {
    const normalizedName = name.trim().toLowerCase();

    if (!normalizedName) {
      throw new Error("Provider name cannot be empty");
    }

    if (this.providers.has(normalizedName)) {
      throw new ProviderAlreadyRegisteredError(normalizedName);
    }

    this.providers.set(normalizedName, provider);
  }

  get(name: string): TProvider {
    const normalizedName = name.trim().toLowerCase();

    const provider = this.providers.get(normalizedName);

    if (provider === undefined) {
      throw new ProviderNotFoundError(normalizedName);
    }

    return provider;
  }

  has(name: string): boolean {
    return this.providers.has(name.trim().toLowerCase());
  }

  getRegisteredNames(): string[] {
    return [...this.providers.keys()];
  }
}
