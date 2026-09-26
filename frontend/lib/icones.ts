import {
  Ambulance, Anchor, Apple, Baby, Backpack, Banknote, Battery, Bed, Bell, Bike, Bird, Bone, Book, BookOpen, Bug, Bus,
  Cake, Calculator, Calendar, Camera, Candy, Car, Carrot, Cat, Cherry, Circle, Clock, Cloud, Coins, Compass, Cookie,
  Diamond, Dog, Droplet, Drum, Egg, Fish, Flag, Flame, Flashlight, Flower2, Footprints, Gem, Gift, Globe, Guitar,
  Hammer, Heart, Hexagon, Hospital, Hourglass, House, Key, Leaf, Lightbulb, Lock, Map, MapPin, Medal, Milk, Moon,
  Mountain, Music, Orbit, Package, Palette, Pencil, Phone, Pizza, Plane, Puzzle, Rabbit, Rainbow, Rocket, Ruler,
  Sailboat, Satellite, School, Scissors, Shell, Ship, Shirt, Smile, Snail, Snowflake, Sparkles, Square, Squirrel,
  Star, Store, Sun, Telescope, Tent, Tractor, TrainFront, TreePine, Triangle, Trophy, Turtle, Umbrella, User, Users,
  Volleyball, Waves, Wrench, Zap, type LucideIcon,
} from "lucide-react";

/**
 * Ícones que o conteúdo (JSON das atividades, avatares, medalhas) pode citar
 * pelo nome, em kebab-case como no lucide. Nome desconhecido vira `sparkles`.
 */
export const ICONES: Record<string, LucideIcon> = {
  ambulance: Ambulance, anchor: Anchor, apple: Apple, baby: Baby, backpack: Backpack, banknote: Banknote,
  battery: Battery, bed: Bed, bell: Bell, bike: Bike, bird: Bird, bone: Bone, book: Book, "book-open": BookOpen,
  bug: Bug, bus: Bus, cake: Cake, calculator: Calculator, calendar: Calendar, camera: Camera, candy: Candy, car: Car,
  carrot: Carrot, cat: Cat, cherry: Cherry, circle: Circle, clock: Clock, cloud: Cloud, coins: Coins, compass: Compass,
  cookie: Cookie, diamond: Diamond, dog: Dog, droplet: Droplet, drum: Drum, egg: Egg, fish: Fish, flag: Flag,
  flame: Flame, flashlight: Flashlight, flower: Flower2, footprints: Footprints, gem: Gem, gift: Gift, globe: Globe,
  guitar: Guitar, hammer: Hammer, heart: Heart, hexagon: Hexagon, hospital: Hospital, hourglass: Hourglass,
  house: House, key: Key, leaf: Leaf, lightbulb: Lightbulb, lock: Lock, map: Map, "map-pin": MapPin, medal: Medal,
  milk: Milk, moon: Moon, mountain: Mountain, music: Music, orbit: Orbit, package: Package, palette: Palette,
  pencil: Pencil, phone: Phone, pizza: Pizza, plane: Plane, puzzle: Puzzle, rabbit: Rabbit, rainbow: Rainbow,
  rocket: Rocket, ruler: Ruler, sailboat: Sailboat, satellite: Satellite, school: School, scissors: Scissors,
  shell: Shell, ship: Ship, shirt: Shirt, smile: Smile, snail: Snail, snowflake: Snowflake, sparkles: Sparkles,
  square: Square, squirrel: Squirrel, star: Star, store: Store, sun: Sun, telescope: Telescope, tent: Tent,
  tractor: Tractor, train: TrainFront, tree: TreePine, triangle: Triangle, trophy: Trophy, turtle: Turtle,
  umbrella: Umbrella, user: User, users: Users, volleyball: Volleyball, waves: Waves, wrench: Wrench, zap: Zap,
};

export function iconePorNome(nome: string | null | undefined): LucideIcon {
  return (nome && ICONES[nome]) || Sparkles;
}
