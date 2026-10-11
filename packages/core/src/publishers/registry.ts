export type PublisherRegistryEntry = { modulePath: string; exportName: string };

const PUBLISHER_REGISTRY: Record<string, PublisherRegistryEntry> = {
  devto: { modulePath: "@inkforge/core/publishers/devto", exportName: "publishToDevto" },
  hashnode: { modulePath: "@inkforge/core/publishers/hashnode", exportName: "publishToHashnode" },
  medium: { modulePath: "@inkforge/core/publishers/medium", exportName: "publishToMedium" },
};

export function resolvePublisher(platform: string): PublisherRegistryEntry {
  const entry = PUBLISHER_REGISTRY[platform];
  if (!entry) {
    throw new Error(
      `Unknown platform: ${platform}. Supported platforms: ${Object.keys(PUBLISHER_REGISTRY).sort().join(", ")}`,
    );
  }
  return entry;
}

export function supportedPlatforms(): string[] {
  return Object.keys(PUBLISHER_REGISTRY);
}
