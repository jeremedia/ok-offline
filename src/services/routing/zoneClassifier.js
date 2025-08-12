/**
 * BRC Zone Classification System
 * 
 * Determines whether coordinates are in:
 * - Urban blocks (must follow streets) 
 * - Open playa (straight-line routing OK)
 * - Restricted areas (route around)
 */

import { 
  haversineDistance, 
  distanceFromCenter, 
  getClockSector,
  getClockPosition, 
  pointInPolygon,
  lineIntersectsPolygon,
  BRC_CENTER,
  BRC_TEMPLE,
  feetToMeters
} from './utils/geoUtils.js'

export class BRCZoneClassifier {
  constructor(gisData) {
    this.gisData = gisData
    this.zones = this.buildZoneMap()
    this.isInitialized = true
  }

  /**
   * Build comprehensive zone map from GIS data and BRC knowledge
   */
  buildZoneMap() {
    return {
      // Urban grid zones - where camps are densely packed and streets must be followed
      urban: this.defineUrbanBoundaries(),
      
      // Open playa zones - where straight-line routing is acceptable
      openPlaya: {
        innerPlaya: this.defineInnerPlayaCircle(),
        outerPlaya: this.defineOuterPlayaArea(), 
        sectorGaps: this.defineEmptySectors()
      },
      
      // Restricted zones - areas to route around
      restricted: {
        manBurnScar: { 
          center: BRC_CENTER, 
          radius: feetToMeters(200) // 200ft radius around Man
        },
        templeBurnScar: { 
          center: BRC_TEMPLE, 
          radius: feetToMeters(150) // 150ft radius around Temple
        },
        deepPlaya: this.defineDeepPlayaArea()
      }
    }
  }

  /**
   * Define urban grid boundaries where street-following is required
   * Based on city block density and camp placement patterns
   */
  defineUrbanBoundaries() {
    const urbanZones = []
    
    // Use city blocks from GIS data if available
    if (this.gisData?.cityBlocks?.features) {
      this.gisData.cityBlocks.features.forEach(block => {
        if (block.geometry?.coordinates?.[0]) {
          urbanZones.push({
            type: 'city_block',
            boundaries: block.geometry.coordinates[0],
            density: this.estimateBlockDensity(block)
          })
        }
      })
    }
    
    // Add manual urban zone definitions for known dense areas
    urbanZones.push(
      ...this.defineManualUrbanZones()
    )
    
    return urbanZones
  }

  /**
   * Define manual urban zones based on BRC layout knowledge
   */
  defineManualUrbanZones() {
    const centerDistance = distanceFromCenter(BRC_CENTER)
    const urbanZones = []
    
    // Dense urban ring: roughly between D street and Esplanade
    // This is where most camps are packed tightly
    const innerUrbanRadius = feetToMeters(1200) // ~D street distance
    const outerUrbanRadius = feetToMeters(2400) // ~Esplanade distance
    
    // Create sector-based urban zones (avoiding center playa)
    for (let clockHour = 2; clockHour <= 10; clockHour++) {
      for (let clockMinute = 0; clockMinute < 60; clockMinute += 15) {
        const clockPos = clockHour * 60 + clockMinute
        const startAngle = (clockPos / 720) * 360 - 7.5 // 15-minute sectors
        const endAngle = startAngle + 15
        
        urbanZones.push({
          type: 'sector_urban',
          sector: `${clockHour}:${clockMinute.toString().padStart(2, '0')}`,
          centerDistance: { min: innerUrbanRadius, max: outerUrbanRadius },
          angleRange: { start: startAngle, end: endAngle },
          density: this.estimateSectorDensity(clockHour, clockPos)
        })
      }
    }
    
    return urbanZones
  }

  /**
   * Define inner playa circle where straight-line routing is preferred
   */
  defineInnerPlayaCircle() {
    return {
      center: BRC_CENTER,
      radius: feetToMeters(1000), // Inner 1000ft is generally open
      type: 'inner_playa',
      allowStraightLine: true
    }
  }

  /**
   * Define outer playa area beyond the city
   */
  defineOuterPlayaArea() {
    return {
      center: BRC_CENTER, 
      innerRadius: feetToMeters(2500), // Beyond Esplanade
      outerRadius: feetToMeters(8000), // Deep playa limit
      type: 'outer_playa',
      allowStraightLine: true
    }
  }

  /**
   * Define empty sectors between city "arms" where straight-line is OK
   */
  defineEmptySectors() {
    // BRC has empty areas between the main city sectors
    return [
      // 10:00-2:00 gap (behind city)
      {
        type: 'sector_gap',
        clockRange: { start: 600, end: 120 }, // 10:00 to 2:00
        centerDistance: { min: feetToMeters(500), max: feetToMeters(3000) },
        allowStraightLine: true
      },
      // Other minor gaps could be added based on specific year layout
    ]
  }

  /**
   * Define deep playa area with special considerations  
   */
  defineDeepPlayaArea() {
    return {
      center: BRC_CENTER,
      innerRadius: feetToMeters(3000),
      type: 'deep_playa', 
      allowStraightLine: true,
      warnings: ['dust_storms', 'unmarked_obstacles', 'extreme_distance']
    }
  }

  /**
   * Classify a coordinate into zone type
   * @param {[number, number]} coord [latitude, longitude] 
   * @returns {Object} Zone classification result
   */
  classifyCoordinate(coord) {
    const centerDist = distanceFromCenter(coord)
    const clockSector = getClockSector(coord)
    const clockPosition = getClockPosition(coord)

    // Check restricted areas first
    const restrictedZone = this.checkRestrictedZones(coord)
    if (restrictedZone) {
      return {
        type: 'restricted',
        zone: restrictedZone,
        allowStraightLine: false,
        requiresDetour: true
      }
    }

    // Check if in inner playa (always straight-line OK)
    if (centerDist <= this.zones.openPlaya.innerPlaya.radius) {
      return {
        type: 'inner_playa',
        allowStraightLine: true,
        zone: this.zones.openPlaya.innerPlaya
      }
    }

    // Check if in outer playa (beyond city)
    const outerPlaya = this.zones.openPlaya.outerPlaya
    if (centerDist >= outerPlaya.innerRadius) {
      return {
        type: 'outer_playa', 
        allowStraightLine: true,
        zone: outerPlaya
      }
    }

    // Check if in empty sector gaps
    const sectorGap = this.checkSectorGaps(coord, clockPosition, centerDist)
    if (sectorGap) {
      return {
        type: 'sector_gap',
        allowStraightLine: true,
        zone: sectorGap
      }
    }

    // Check if in urban zones (dense city blocks)
    const urbanZone = this.checkUrbanZones(coord)
    if (urbanZone) {
      return {
        type: 'urban',
        allowStraightLine: false,
        requiresStreets: true,
        zone: urbanZone,
        density: urbanZone.density
      }
    }

    // Default: assume open playa if not clearly urban
    return {
      type: 'open_playa',
      allowStraightLine: true, 
      zone: { type: 'default_open', certainty: 'medium' }
    }
  }

  /**
   * Check if coordinate is in any restricted zone
   */
  checkRestrictedZones(coord) {
    const { restricted } = this.zones

    // Check Man burn scar
    if (haversineDistance(coord, restricted.manBurnScar.center) <= restricted.manBurnScar.radius) {
      return { ...restricted.manBurnScar, name: 'man_burn_scar' }
    }

    // Check Temple burn scar  
    if (haversineDistance(coord, restricted.templeBurnScar.center) <= restricted.templeBurnScar.radius) {
      return { ...restricted.templeBurnScar, name: 'temple_burn_scar' }
    }

    return null
  }

  /**
   * Check if coordinate is in sector gap (empty area between city arms)
   */
  checkSectorGaps(coord, clockPosition, centerDist) {
    for (const gap of this.zones.openPlaya.sectorGaps) {
      const { clockRange, centerDistance } = gap
      
      // Check if within distance range
      if (centerDist >= centerDistance.min && centerDist <= centerDistance.max) {
        // Check if within clock range (handle wrapping around 12:00)
        let inRange = false
        if (clockRange.start > clockRange.end) {
          // Wraps around (e.g., 10:00 to 2:00)
          inRange = clockPosition >= clockRange.start || clockPosition <= clockRange.end
        } else {
          inRange = clockPosition >= clockRange.start && clockPosition <= clockRange.end
        }
        
        if (inRange) return gap
      }
    }
    return null
  }

  /**
   * Check if coordinate is in dense urban zone
   */
  checkUrbanZones(coord) {
    // Check GIS-based city blocks
    for (const zone of this.zones.urban) {
      if (zone.boundaries && pointInPolygon(coord, zone.boundaries)) {
        return zone
      }
      
      // Check sector-based urban zones
      if (zone.type === 'sector_urban') {
        const centerDist = distanceFromCenter(coord)
        const clockPos = getClockPosition(coord)
        const angle = (clockPos / 720) * 360
        
        if (centerDist >= zone.centerDistance.min && 
            centerDist <= zone.centerDistance.max &&
            this.angleInRange(angle, zone.angleRange.start, zone.angleRange.end)) {
          return zone
        }
      }
    }
    
    return null
  }

  /**
   * Check if angle is within range (handles wrapping)
   */
  angleInRange(angle, start, end) {
    if (start <= end) {
      return angle >= start && angle <= end
    } else {
      // Wraps around 360°
      return angle >= start || angle <= end
    }
  }

  /**
   * Determine if straight-line routing is allowed between two points
   * @param {[number, number]} startCoord [latitude, longitude]
   * @param {[number, number]} endCoord [latitude, longitude]
   * @returns {Object} Routing recommendation
   */
  canStraightLine(startCoord, endCoord) {
    const startZone = this.classifyCoordinate(startCoord)
    const endZone = this.classifyCoordinate(endCoord)
    
    // If either point is in urban zone, need to consider hybrid routing
    if (!startZone.allowStraightLine || !endZone.allowStraightLine) {
      return this.analyzeHybridRoute(startCoord, endCoord, startZone, endZone)
    }
    
    // Both points allow straight-line, but check path for obstacles
    const pathObstacles = this.checkPathObstacles(startCoord, endCoord)
    
    return {
      allowed: pathObstacles.length === 0,
      obstacles: pathObstacles,
      confidence: pathObstacles.length === 0 ? 'high' : 'low',
      recommendation: pathObstacles.length === 0 ? 'straight_line' : 'hybrid'
    }
  }

  /**
   * Analyze if hybrid routing (urban→playa→urban) would be beneficial
   */
  analyzeHybridRoute(startCoord, endCoord, startZone, endZone) {
    const directDistance = haversineDistance(startCoord, endCoord)
    const startSector = getClockSector(startCoord) 
    const endSector = getClockSector(endCoord)
    const sectorDifference = Math.abs(startSector - endSector)
    
    // Hybrid routing is beneficial when:
    // 1. Crossing multiple sectors (>2 hour difference)
    // 2. Route would pass through center playa
    // 3. Distance savings > 20%
    
    const routeCrossesCenter = this.routeCrossesCenter(startCoord, endCoord)
    const potentialSavings = this.estimateHybridSavings(startCoord, endCoord)
    
    if (sectorDifference > 2 && routeCrossesCenter && potentialSavings > 0.2) {
      return {
        allowed: false, // Not pure straight-line
        recommendation: 'hybrid',
        confidence: 'high',
        benefits: {
          distanceSavings: potentialSavings,
          crossesOpenPlaya: routeCrossesCenter,
          avoidsDenseUrban: true
        },
        hybridRoute: {
          startUrbanExit: this.findUrbanExit(startCoord),
          endUrbanEntry: this.findUrbanEntry(endCoord),
          playaCrossing: { start: startCoord, end: endCoord }
        }
      }
    }
    
    return {
      allowed: false,
      recommendation: 'street_following', 
      confidence: 'medium',
      reason: 'urban_zones_require_streets'
    }
  }

  /**
   * Check if route crosses through center playa
   */
  routeCrossesCenter(startCoord, endCoord) {
    const centerDist = Math.min(
      distanceFromCenter(startCoord),
      distanceFromCenter(endCoord)
    )
    
    // If both points are relatively close to center, route likely crosses
    return centerDist < feetToMeters(2000)
  }

  /**
   * Estimate distance savings from hybrid vs pure street routing
   */
  estimateHybridSavings(startCoord, endCoord) {
    const straightDistance = haversineDistance(startCoord, endCoord)
    
    // Rough estimate: street-only route follows perimeter (arc) 
    // Hybrid route has urban segments + direct playa crossing
    const centerDist = (distanceFromCenter(startCoord) + distanceFromCenter(endCoord)) / 2
    const estimatedStreetDistance = centerDist * 1.8 // Rough perimeter multiplier
    
    return Math.max(0, (estimatedStreetDistance - straightDistance) / estimatedStreetDistance)
  }

  /**
   * Find optimal exit point from urban area toward center
   */
  findUrbanExit(coord) {
    // Find nearest point on inner playa boundary in direction of center
    const bearingToCenter = this.calculateBearing(coord, BRC_CENTER)
    const distToInnerPlaya = this.zones.openPlaya.innerPlaya.radius
    
    return this.projectCoordinate(BRC_CENTER, bearingToCenter + 180, distToInnerPlaya)
  }

  /**
   * Find optimal entry point to urban area from center
   */
  findUrbanEntry(coord) {
    // Similar to urban exit but in reverse direction
    const bearingFromCenter = this.calculateBearing(BRC_CENTER, coord)
    const distToInnerPlaya = this.zones.openPlaya.innerPlaya.radius
    
    return this.projectCoordinate(BRC_CENTER, bearingFromCenter, distToInnerPlaya)
  }

  /**
   * Check for obstacles along straight-line path
   */
  checkPathObstacles(startCoord, endCoord) {
    const obstacles = []
    const pathLine = [startCoord, endCoord]
    
    // Check restricted areas
    for (const [name, zone] of Object.entries(this.zones.restricted)) {
      if (this.lineIntersectsCircle(pathLine, zone.center, zone.radius)) {
        obstacles.push({ type: 'restricted', name, zone })
      }
    }
    
    // Check urban zones that would require detour
    for (const zone of this.zones.urban) {
      if (zone.boundaries && lineIntersectsPolygon(pathLine, zone.boundaries)) {
        obstacles.push({ type: 'urban_block', zone })
      }
    }
    
    return obstacles
  }

  /**
   * Check if line intersects with circular area
   */
  lineIntersectsCircle([start, end], center, radius) {
    // Distance from center to line segment
    const distToLine = this.distanceToLineSegment(center, start, end)
    return distToLine <= radius
  }

  /**
   * Calculate distance from point to line segment
   */
  distanceToLineSegment([px, py], [x1, y1], [x2, y2]) {
    const dx = x2 - x1
    const dy = y2 - y1
    
    if (dx === 0 && dy === 0) {
      return haversineDistance([px, py], [x1, y1])
    }
    
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
    const nearestX = x1 + t * dx
    const nearestY = y1 + t * dy
    
    return haversineDistance([px, py], [nearestX, nearestY])
  }

  /**
   * Estimate block density for urban classification
   */
  estimateBlockDensity(block) {
    // Simple heuristic based on distance from center and block size
    // Closer blocks and smaller blocks = higher density
    if (!block.geometry?.coordinates?.[0]) return 0
    
    const coords = block.geometry.coordinates[0]
    const center = this.calculatePolygonCenter(coords)
    const centerDist = distanceFromCenter(center)
    const blockArea = this.calculatePolygonArea(coords)
    
    // Higher density = closer to center + smaller area
    return Math.max(0, 1 - (centerDist / feetToMeters(3000))) * (1000 / blockArea)
  }

  /**
   * Estimate sector density based on clock position
   */
  estimateSectorDensity(clockHour, clockPosition) {
    // BRC density patterns: higher between 2:00-10:00, lower at night hours
    if (clockHour >= 2 && clockHour <= 10) {
      return 0.8 // High density
    } else {
      return 0.3 // Lower density
    }
  }

  /**
   * Calculate polygon center point
   */
  calculatePolygonCenter(coords) {
    const avgLat = coords.reduce((sum, [lat]) => sum + lat, 0) / coords.length
    const avgLng = coords.reduce((sum, [, lng]) => sum + lng, 0) / coords.length
    return [avgLat, avgLng]
  }

  /**
   * Calculate polygon area (simplified)
   */
  calculatePolygonArea(coords) {
    if (coords.length < 3) return 0
    
    let area = 0
    for (let i = 0; i < coords.length - 1; i++) {
      area += coords[i][0] * coords[i + 1][1]
      area -= coords[i + 1][0] * coords[i][1]
    }
    return Math.abs(area) / 2
  }

  /**
   * Project coordinate in given direction and distance
   */
  projectCoordinate([lat, lng], bearing, distance) {
    const bearingRad = bearing * (Math.PI / 180)
    const latRad = lat * (Math.PI / 180)
    const lngRad = lng * (Math.PI / 180)
    
    const newLatRad = Math.asin(Math.sin(latRad) * Math.cos(distance / EARTH_RADIUS_METERS) +
                               Math.cos(latRad) * Math.sin(distance / EARTH_RADIUS_METERS) * Math.cos(bearingRad))
    
    const newLngRad = lngRad + Math.atan2(Math.sin(bearingRad) * Math.sin(distance / EARTH_RADIUS_METERS) * Math.cos(latRad),
                                         Math.cos(distance / EARTH_RADIUS_METERS) - Math.sin(latRad) * Math.sin(newLatRad))
    
    return [newLatRad * (180 / Math.PI), newLngRad * (180 / Math.PI)]
  }

  /**
   * Calculate bearing between two points
   */
  calculateBearing([lat1, lng1], [lat2, lng2]) {
    const dLng = (lng2 - lng1) * (Math.PI / 180)
    const y = Math.sin(dLng) * Math.cos(lat2 * (Math.PI / 180))
    const x = Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) - 
              Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos(dLng)
    let bearing = Math.atan2(y, x) * (180 / Math.PI)
    return (bearing + 360) % 360
  }
}