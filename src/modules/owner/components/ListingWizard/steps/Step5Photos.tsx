import React from "react";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { ImagePlus, X } from "lucide-react";

export function Step5Photos({ data, updateData }: { data: any; updateData: (data: any) => void }) {
  const [imageUrl, setImageUrl] = React.useState("");

  const addImage = () => {
    if (imageUrl) {
      updateData({ images: [...(data.images || []), imageUrl] });
      setImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...(data.images || [])];
    newImages.splice(index, 1);
    updateData({ images: newImages });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-1">Photos & Description</h2>
        <p className="text-sm text-neutral-500">
          Listings with high quality photos get 5x more inquiries.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label>Property Images</Label>

          <div className="flex gap-2">
            <Input
              placeholder="Paste an image URL here..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addImage()}
            />
            <button
              onClick={addImage}
              className="px-4 py-2 bg-neutral-100 text-neutral-700 font-medium rounded-md hover:bg-neutral-200 shrink-0"
            >
              Add
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {/* Upload Box (Mock) */}
            <div className="aspect-square border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center text-neutral-500 bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors">
              <ImagePlus className="w-8 h-8 mb-2 text-neutral-400" />
              <span className="text-sm font-medium">Upload Photos</span>
              <span className="text-xs mt-1">or drag & drop</span>
            </div>

            {/* Added Images */}
            {(data.images || []).map((img: string, i: number) => (
              <div
                key={i}
                className="aspect-square rounded-lg overflow-hidden relative group border border-neutral-200"
              >
                <img src={img} alt="Property" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-neutral-200" />

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Property Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Spacious 2 BHK near IT Park"
              value={data.title || ""}
              onChange={(e) => updateData({ title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the property, nearby landmarks, society rules..."
              className="h-32"
              value={data.description || ""}
              onChange={(e) => updateData({ description: e.target.value })}
            />
            <p className="text-xs text-neutral-500 text-right">
              {data.description?.length || 0}/5000
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
