import { describe, expect, it } from 'vitest';
import { 补齐世界地图空间字段 } from '../utils/mapSpatial';

const 点在矩形内 = (point: { x: number; y: number }, rect: { minX: number; maxX: number; minY: number; maxY: number }) => (
    point.x >= rect.minX && point.x <= rect.maxX && point.y >= rect.minY && point.y <= rect.maxY
);

const 正交线段穿过矩形 = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    rect: { minX: number; maxX: number; minY: number; maxY: number }
) => {
    if (from.x === to.x) {
        const minY = Math.min(from.y, to.y);
        const maxY = Math.max(from.y, to.y);
        return from.x >= rect.minX && from.x <= rect.maxX && maxY >= rect.minY && minY <= rect.maxY;
    }
    if (from.y === to.y) {
        const minX = Math.min(from.x, to.x);
        const maxX = Math.max(from.x, to.x);
        return from.y >= rect.minY && from.y <= rect.maxY && maxX >= rect.minX && minX <= rect.maxX;
    }
    return true;
};

describe('地图空间道路规划', () => {
    it('会把模型给出的斜线道路改成避让建筑的正交路径', () => {
        const world = 补齐世界地图空间字段({
            地图层级: [{
                ID: 'layer_test',
                名称: '青松门',
                层级: '具体地点',
                网格宽度: 24,
                网格高度: 18,
                锚点坐标: { x: 0, y: 0 }
            }],
            地图建筑: [{
                ID: 'hall',
                名称: '宗门大殿',
                所在层级ID: 'layer_test',
                四角坐标: [
                    { x: 8, y: 5 },
                    { x: 16, y: 5 },
                    { x: 16, y: 12 },
                    { x: 8, y: 12 }
                ]
            }],
            地图道路: [{
                ID: 'bad_road',
                名称: '穿殿斜路',
                所在层级ID: 'layer_test',
                路径点: [
                    { x: 2, y: 2 },
                    { x: 22, y: 16 }
                ]
            }]
        } as any);
        const road = world.地图道路.find((item: any) => item.ID === 'bad_road')!;
        const rect = { minX: 7.9, maxX: 16.1, minY: 4.9, maxY: 12.1 };

        expect(road.路径点.length).toBeGreaterThan(2);
        road.路径点.forEach((point: any, index: number) => {
            expect(点在矩形内(point, rect)).toBe(false);
            const next = road.路径点[index + 1];
            if (!next) return;
            expect(point.x === next.x || point.y === next.y).toBe(true);
            expect(正交线段穿过矩形(point, next, rect)).toBe(false);
        });
    });

    it('会把主角寝居这类室内地点补成建筑面而不是野外空图', () => {
        const world = 补齐世界地图空间字段({
            地图层级: [],
            地图建筑: [],
            地图道路: [],
            地图人物: []
        } as any, {
            env: {
                大地点: '青州',
                中地点: '杨家剑庄',
                小地点: '松风阁',
                具体地点: '主角寝居'
            } as any
        });

        const specificLayer = world.地图层级.find((item: any) => item.名称 === '主角寝居');
        expect(specificLayer).toBeTruthy();
        const buildings = world.地图建筑.filter((item: any) => item.所在层级ID === specificLayer?.ID);
        expect(buildings.length).toBeGreaterThan(0);
        expect(buildings[0].名称).toBe('主角寝居');
        expect(buildings[0].分类).toBe('居所');
        expect(world.地图道路.some((item: any) => item.所在层级ID === specificLayer?.ID && item.名称 === '野径')).toBe(false);
    });

    it('聚落布局使用优化道路并丢弃模型给出的无意义旧道路', () => {
        const world = 补齐世界地图空间字段({
            地图层级: [{
                ID: 'layer_town',
                名称: '杨府',
                层级: '具体地点',
                网格宽度: 40,
                网格高度: 30,
                锚点坐标: { x: 0, y: 0 }
            }],
            地图建筑: Array.from({ length: 8 }).map((_, index) => ({
                ID: `building_${index}`,
                名称: `院落${index + 1}`,
                所在层级ID: 'layer_town',
                四角坐标: [
                    { x: 2 + index * 3, y: 2 },
                    { x: 4 + index * 3, y: 2 },
                    { x: 4 + index * 3, y: 4 },
                    { x: 2 + index * 3, y: 4 }
                ]
            })),
            地图道路: [{
                ID: 'stray_diagonal',
                名称: '莫名斜线',
                所在层级ID: 'layer_town',
                路径点: [
                    { x: 1, y: 1 },
                    { x: 39, y: 29 }
                ]
            }]
        } as any);
        const roads = world.地图道路.filter((item: any) => item.所在层级ID === 'layer_town');
        const buildings = world.地图建筑.filter((item: any) => item.所在层级ID === 'layer_town');
        const buildingRects = buildings.map((building: any) => {
            const xs = building.四角坐标.map((point: any) => point.x);
            const ys = building.四角坐标.map((point: any) => point.y);
            return {
                minX: Math.min(...xs) - 0.1,
                maxX: Math.max(...xs) + 0.1,
                minY: Math.min(...ys) - 0.1,
                maxY: Math.max(...ys) + 0.1
            };
        });
        const clusterXs = buildings.flatMap((building: any) => building.四角坐标.map((point: any) => point.x));
        const clusterYs = buildings.flatMap((building: any) => building.四角坐标.map((point: any) => point.y));
        const clusterBounds = {
            minX: Math.min(...clusterXs) - 4,
            maxX: Math.max(...clusterXs) + 4,
            minY: Math.min(...clusterYs) - 4,
            maxY: Math.max(...clusterYs) + 4,
        };

        expect(roads.some((road: any) => road.ID === 'stray_diagonal')).toBe(false);
        expect(roads.some((road: any) => /接入路/u.test(road.名称))).toBe(false);
        expect(roads.length).toBeLessThanOrEqual(6);
        roads.forEach((road: any) => {
            road.路径点.forEach((point: any, index: number) => {
                expect(point.x).toBeGreaterThanOrEqual(clusterBounds.minX);
                expect(point.x).toBeLessThanOrEqual(clusterBounds.maxX);
                expect(point.y).toBeGreaterThanOrEqual(clusterBounds.minY);
                expect(point.y).toBeLessThanOrEqual(clusterBounds.maxY);
                const next = road.路径点[index + 1];
                if (!next) return;
                expect(point.x === next.x || point.y === next.y).toBe(true);
                buildingRects.forEach((rect: any) => {
                    expect(正交线段穿过矩形(point, next, rect)).toBe(false);
                });
            });
        });
    });
});
