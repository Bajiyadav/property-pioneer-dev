import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center">
      <Select value={i18n.language} onValueChange={changeLanguage}>
        <SelectTrigger className="h-8 w-[110px] sm:w-[130px] border-none bg-secondary/50 hover:bg-secondary/80 focus:ring-0 gap-1.5 rounded-full px-2.5">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent align="end" className="rounded-xl">
          <SelectItem value="en" className="rounded-lg cursor-pointer">
            English
          </SelectItem>
          <SelectItem value="hi" className="rounded-lg cursor-pointer">
            हिंदी (Hindi)
          </SelectItem>
          <SelectItem value="te" className="rounded-lg cursor-pointer">
            తెలుగు (Telugu)
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
