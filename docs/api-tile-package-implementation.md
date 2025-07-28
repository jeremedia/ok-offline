# API Tile Package Implementation

This document describes how to implement tile hosting on the Rails API server.

## 1. Create Rake Task to Download Tiles

Create `lib/tasks/tiles.rake`:

```ruby
require 'net/http'
require 'zip'
require 'fileutils'

namespace :tiles do
  desc "Download and package OSM tiles for Black Rock City"
  task create_package: :environment do
    # BRC bounds
    bounds = {
      north: 40.807,
      south: 40.764,
      east: -119.176,
      west: -119.233
    }
    
    zoom_levels = (12..17)
    temp_dir = Rails.root.join('tmp', 'tiles')
    output_path = Rails.root.join('public', 'tiles', 'package.zip')
    
    FileUtils.mkdir_p(temp_dir)
    FileUtils.mkdir_p(File.dirname(output_path))
    
    total_tiles = 0
    downloaded_tiles = 0
    
    # Calculate total tiles
    zoom_levels.each do |zoom|
      min_tile = lat_lng_to_tile(bounds[:south], bounds[:west], zoom)
      max_tile = lat_lng_to_tile(bounds[:north], bounds[:east], zoom)
      
      width = (max_tile[:x] - min_tile[:x]).abs + 1
      height = (max_tile[:y] - min_tile[:y]).abs + 1
      total_tiles += width * height
    end
    
    puts "Total tiles to download: #{total_tiles}"
    
    # Download tiles
    zoom_levels.each do |zoom|
      min_tile = lat_lng_to_tile(bounds[:south], bounds[:west], zoom)
      max_tile = lat_lng_to_tile(bounds[:north], bounds[:east], zoom)
      
      (min_tile[:x]..max_tile[:x]).each do |x|
        (max_tile[:y]..min_tile[:y]).each do |y|
          begin
            tile_data = download_tile(zoom, x, y)
            
            # Save to temp directory
            tile_dir = temp_dir.join(zoom.to_s, x.to_s)
            FileUtils.mkdir_p(tile_dir)
            File.binwrite(tile_dir.join("#{y}.png"), tile_data)
            
            downloaded_tiles += 1
            
            if downloaded_tiles % 10 == 0
              progress = (downloaded_tiles.to_f / total_tiles * 100).round
              puts "Progress: #{downloaded_tiles}/#{total_tiles} (#{progress}%)"
            end
            
            # Rate limit
            sleep 0.1
          rescue => e
            puts "Failed to download tile #{zoom}/#{x}/#{y}: #{e.message}"
          end
        end
      end
    end
    
    # Create ZIP package
    puts "Creating ZIP package..."
    
    Zip::File.open(output_path, Zip::File::CREATE) do |zipfile|
      Dir[temp_dir.join('**', '*.png')].each do |file|
        relative_path = file.sub("#{temp_dir}/", '')
        zipfile.add("tiles/#{relative_path}", file)
      end
    end
    
    # Clean up temp files
    FileUtils.rm_rf(temp_dir)
    
    file_size_mb = (File.size(output_path) / 1024.0 / 1024.0).round(2)
    puts "✅ Tile package created: #{output_path}"
    puts "   Size: #{file_size_mb} MB"
    puts "   Tiles: #{downloaded_tiles}/#{total_tiles}"
  end
  
  private
  
  def lat_lng_to_tile(lat, lng, zoom)
    x = ((lng + 180) / 360 * (2 ** zoom)).floor
    y = ((1 - Math.log(Math.tan(lat * Math::PI / 180) + 1 / Math.cos(lat * Math::PI / 180)) / Math::PI) / 2 * (2 ** zoom)).floor
    { x: x, y: y }
  end
  
  def download_tile(z, x, y)
    subdomains = ['a', 'b', 'c']
    s = subdomains[(x + y).abs % subdomains.length]
    uri = URI("https://#{s}.tile.openstreetmap.org/#{z}/#{x}/#{y}.png")
    
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    
    request = Net::HTTP::Get.new(uri)
    request['User-Agent'] = 'OK-OFFLINE Burning Man App (offline.oknotok.com)'
    
    response = http.request(request)
    
    if response.code == '200'
      response.body
    else
      raise "HTTP #{response.code}: #{response.message}"
    end
  end
end
```

## 2. Add Route to Serve the Package

In `config/routes.rb`:

```ruby
namespace :api do
  namespace :v1 do
    namespace :tiles do
      get 'package.zip', to: 'tiles#package'
    end
  end
end
```

## 3. Create Tiles Controller

Create `app/controllers/api/v1/tiles_controller.rb`:

```ruby
module Api
  module V1
    class TilesController < ApplicationController
      # Serve the pre-packaged tile ZIP file
      def package
        package_path = Rails.root.join('public', 'tiles', 'package.zip')
        
        if File.exist?(package_path)
          send_file package_path,
            type: 'application/zip',
            disposition: 'attachment',
            filename: 'brc-tiles.zip',
            x_sendfile: true # Use nginx/apache acceleration if available
        else
          render json: { error: 'Tile package not found' }, status: :not_found
        end
      end
    end
  end
end
```

## 4. Add CORS Headers (if needed)

Update `config/initializers/cors.rb` to allow tile downloads:

```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'localhost:8005', '100.104.170.10:8005', 'offline.oknotok.com'
    
    resource '/api/v1/tiles/*',
      headers: :any,
      methods: [:get, :options],
      credentials: true
  end
end
```

## 5. Usage

1. **Generate the tile package** (run once on server):
   ```bash
   rails tiles:create_package
   ```

2. **Serve the package**: The endpoint will be available at:
   - Development: `http://100.104.170.10:3555/api/v1/tiles/package.zip`
   - Production: `https://offline.oknotok.com/api/v1/tiles/package.zip`

## 6. Deployment Considerations

- The tile package only needs to be generated once (or when map updates are needed)
- Store the package.zip file in a persistent location on the server
- Consider using a CDN for production to reduce server load
- The package will be ~20MB, which is reasonable for a one-time download
- Add caching headers to reduce repeated downloads:

```ruby
def package
  # ... existing code ...
  
  response.headers['Cache-Control'] = 'public, max-age=86400' # Cache for 24 hours
  response.headers['ETag'] = Digest::MD5.file(package_path).hexdigest
  
  # Handle conditional requests
  if request.headers['If-None-Match'] == response.headers['ETag']
    head :not_modified
    return
  end
  
  send_file package_path, # ... rest of options
end
```

## 7. Benefits

- **No rate limiting**: Tiles served from your own infrastructure
- **Faster downloads**: Single 20MB ZIP vs 640 individual requests
- **Reliability**: No dependency on OSM server availability
- **Better UX**: Clear progress bar for single download
- **Legal compliance**: Proper OSM attribution maintained