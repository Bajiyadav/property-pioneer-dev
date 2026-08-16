import React from "react";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { MapPin, Search } from "lucide-react";

export function Step1Location({
  data,
  updateData,
}: {
  data: any;
  updateData: (data: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-1">
          Where is your property located?
        </h2>
        <p className="text-sm text-neutral-500">
          Accurate location helps tenants find your property easily.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <select
            id="city"
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={data.city}
            onChange={(e) => updateData({ city: e.target.value })}
          >
            <option value="">Select City</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Pune">Pune</option>
            <option value="Delhi">Delhi</option>
            <option value="Chennai">Chennai</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="locality">Locality / Area *</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              id="locality"
              placeholder="e.g. Madhapur, Hitech City"
              className="pl-9"
              value={data.locality}
              onChange={(e) => updateData({ locality: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Full Address *</Label>
          <Input
            id="address"
            placeholder="House No, Building Name, Street"
            value={data.address}
            onChange={(e) => updateData({ address: e.target.value })}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="landmark">Landmark (Optional)</Label>
          <Input
            id="landmark"
            placeholder="e.g. Near Apollo Hospital"
            value={data.landmark}
            onChange={(e) => updateData({ landmark: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
        <MapPin className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <h4 className="text-sm font-medium text-blue-900">Pin on Map</h4>
          <p className="text-sm text-blue-700 mt-1 mb-3">
            Pinning your exact location on the map increases visibility by up to 40%.
          </p>
          <Button variant="outline" className="bg-white" size="sm">
            Set Location on Map
          </Button>
        </div>
      </div>
    </div>
  );
}
