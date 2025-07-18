
import { getTranslation } from "@/lib/utils-ssr";

export default async function PersonalDashboardPage() {
  const t = await getTranslation();
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t('personal.welcome')}</h1>
      <p>{t('personal.limitedResources')}</p>
    </div>
  );
}
