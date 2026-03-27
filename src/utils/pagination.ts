import { logger } from "../client.js";

export async function fetchAllPages<T>(
  fetcher: (page: number) => Promise<{ data: any }>,
  itemsKey: string,
  maxPages = 20
): Promise<T[]> {
  const allItems: T[] = [];

  for (let page = 1; page <= maxPages; page++) {
    logger.debug(`Fetching page ${page} of ${itemsKey}...`);

    const response = await fetcher(page);
    const items: T[] = response.data[itemsKey] ?? [];

    if (items.length === 0) break;

    allItems.push(...items);

    const totalPages: number | undefined = response.data.total_pages;
    if (totalPages !== undefined && page >= totalPages) break;

    if (page < maxPages) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return allItems;
}
