import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/navbar";
import ProviderCard from "@/components/provider-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, Filter, MapPin, Star } from "lucide-react";

export default function Search() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  
  const [searchCategory, setSearchCategory] = useState(urlParams.get("category") || "all");
  const [searchLocation, setSearchLocation] = useState(urlParams.get("location") || "");
  const [minRating, setMinRating] = useState("");
  const [videoCall, setVideoCall] = useState(false);
  const [inPerson, setInPerson] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["/api/providers/search", { 
      category: searchCategory, 
      location: searchLocation,
      minRating: minRating ? parseFloat(minRating) : undefined,
      videoCall,
      inPerson
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchCategory && searchCategory !== "all") params.set("category", searchCategory);
      if (searchLocation) params.set("location", searchLocation);
      if (minRating) params.set("minRating", minRating);
      if (videoCall) params.set("videoCall", "true");
      if (inPerson) params.set("inPerson", "true");
      
      const response = await fetch(`/api/providers/search?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch providers");
      return response.json();
    },
  });

  const handleSearch = () => {
    // Trigger a new search by updating query key dependencies
    // The useQuery will automatically refetch when dependencies change
  };

  const clearFilters = () => {
    setSearchCategory("all");
    setSearchLocation("");
    setMinRating("");
    setVideoCall(false);
    setInPerson(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Find Your Perfect Provider</h1>
          
          {/* Search Bar */}
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Select value={searchCategory} onValueChange={setSearchCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {(categories as any[]).map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Enter location..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button onClick={handleSearch} className="px-8">
                <SearchIcon className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="px-6"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Minimum Rating
                    </label>
                    <Select value={minRating} onValueChange={setMinRating}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any rating</SelectItem>
                        <SelectItem value="4.0">4.0+ stars</SelectItem>
                        <SelectItem value="4.5">4.5+ stars</SelectItem>
                        <SelectItem value="4.8">4.8+ stars</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Meeting Type
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="video" 
                          checked={videoCall}
                          onCheckedChange={(checked) => setVideoCall(checked === true)}
                        />
                        <label htmlFor="video" className="text-sm text-slate-600">
                          Video Call Available
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="inperson" 
                          checked={inPerson}
                          onCheckedChange={(checked) => setInPerson(checked === true)}
                        />
                        <label htmlFor="inperson" className="text-sm text-slate-600">
                          In-Person Available
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 flex items-end">
                    <Button variant="outline" onClick={clearFilters} className="w-full">
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-600">
            {providers.length} provider{providers.length !== 1 ? 's' : ''} found
            {searchLocation && ` in ${searchLocation}`}
            {searchCategory && ` for ${(categories as any[]).find((c: any) => c.id === searchCategory)?.name}`}
          </p>
          
          {(searchCategory || searchLocation || minRating || videoCall || inPerson) && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">Filters:</span>
              {searchCategory && (
                <Badge variant="secondary">
                  {(categories as any[]).find((c: any) => c.id === searchCategory)?.name}
                </Badge>
              )}
              {searchLocation && (
                <Badge variant="secondary">
                  <MapPin className="h-3 w-3 mr-1" />
                  {searchLocation}
                </Badge>
              )}
              {minRating && (
                <Badge variant="secondary">
                  <Star className="h-3 w-3 mr-1" />
                  {minRating}+ stars
                </Badge>
              )}
              {videoCall && <Badge variant="secondary">Video Call</Badge>}
              {inPerson && <Badge variant="secondary">In-Person</Badge>}
            </div>
          )}
        </div>

        {/* Provider Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-48 bg-slate-200 animate-pulse"></div>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <Card className="p-12 text-center">
            <SearchIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No providers found</h3>
            <p className="text-slate-600 mb-4">
              Try adjusting your search criteria or clearing some filters.
            </p>
            <Button onClick={clearFilters} variant="outline">
              Clear All Filters
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider: any) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
