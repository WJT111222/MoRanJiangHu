/**
 * 预置物品图片库
 * 常见武侠物品的预生成图片 URL。
 * 优先按中文物品名完全一致命中；若玩家/AI 使用同义结构名，则先规范化到结构化物品库再命中。
 * 仍然只有已有图片 URL 的条目会返回图片，匹配不到时才触发实时生图。
 */

import { 查找结构化物品 } from './structuredItemLibrary';

export interface 预置物品图片条目 {
    名称: string;
    类型: string;
    品质: string;
    图片URL: string;
}

/**
 * 预置物品图片注册表
 * 按类别组织，每个条目包含中文名称、类型、品质和图片 URL
 */
export const 预置物品图片列表: 预置物品图片条目[] = [
    // ─── 武器：剑 ───────────────────────────────────────────────────────
    { 名称: '青钢剑', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/vLXGG1mSKV4IOnsxZ4v5jYYwVYrxxICG.png' },
    { 名称: '精钢长剑', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/6LwQztE8VYNtASDKXXlAUtpPXKNw8EwV.png' },
    { 名称: '玄铁重剑', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/2Gd3JBUdc0vGjBluzza6P7liQOdUxpqr.png' },
    { 名称: '碧水长剑', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/xzkQxg6OVAnHpIz6qvociGs8pzAUcITi.png' },
    { 名称: '断水剑', 类型: '武器', 品质: '绝世', 图片URL: 'https://cdn.nodeimage.com/i/6oM1Dlu5Kcj167pgIDHn0E1MPILUlBN0.png' },
    { 名称: '锈铁剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/icCGuYe9LVdbp2YqARTa76eqENHUpjGS.png' },

    // ─── 武器：刀 ───────────────────────────────────────────────────────
    { 名称: '柳叶刀', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/AGQQr0lKh8R07fvctIT0XmUdDtezcjI5.png' },
    { 名称: '鬼头大刀', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/GySIwj0beOKJ4l3R6CXdRcS7nmbC8HUm.png' },
    { 名称: '雪饮狂刀', 类型: '武器', 品质: '绝世', 图片URL: 'https://cdn.nodeimage.com/i/9E42QlZUX3wBfKmKNXZ4Wb7fRcvAkFlu.png' },

    // ─── 武器：枪/棍 ─────────────────────────────────────────────────────
    { 名称: '白蜡杆枪', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/BTE35CiGQULThprCIUhZlJEYs2wC8qYt.png' },
    { 名称: '霸王枪', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/8uoBAsKUekpiMSMeEnZCcgRLarBn4F6p.png' },
    { 名称: '齐眉棍', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/KukBR96xIsqx1gzno1EQ1N2xsDbDiIZ1.png' },

    // ─── 武器：弓/暗器 ───────────────────────────────────────────────────
    { 名称: '铁胎弓', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/LeeEMHJ8MkIGRhb0BVASexIRCuRAuJ9a.png' },
    { 名称: '袖箭', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/2WMe1LuxzeZITKpxswXoVXSzriguKLuZ.png' },
    { 名称: '毒针', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/SnUWKXjcU6iyLOwCdFEGizw0NOXdVV1d.png' },

    // ─── 防具 ───────────────────────────────────────────────────────────
    { 名称: '玄铁护甲', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/zgclROHwr2GKk4We0CWhPcrr27r4FRqD.png' },
    { 名称: '锁子甲', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/ZwtKSaLchJVYYJ4kXgSsbXZTdWafcfhz.png' },
    { 名称: '软猬甲', 类型: '防具', 品质: '绝世', 图片URL: 'https://cdn.nodeimage.com/i/bQsZJ1I4ipD1MWF9qbYuXdJXaLucw4JY.png' },
    { 名称: '布衣', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/iajVZ1Mn7fq7tpixwUA1IcQfBiu15vaX.png' },
    { 名称: '青衫', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/wrSXHk0I6UV3yO3OCkXrfQ1n5X8lFnGn.png' },
    { 名称: '粗布青衫', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/DtPGa49oMnRIHA6usSKDK7DIvoh8JXp3.png' },
    { 名称: '青色练功服', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/YVanUR5dwof5Z8XNWYbXjuuIjyK0JxaU.png' },
    { 名称: '粗布长裤', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/Lg4WvDZfRGncpumgtlEZhRSDN5dPrbKs.png' },
    { 名称: '旧布鞋', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/Zt6iH5DGpvgIWzCmp4j0YFiIQsFDqral.png' },
    { 名称: '护腕', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/dVdXYyUFsigNYLlrXB6Rbnmc2nCulNwi.png' },

    // ─── 消耗品：丹药 ─────────────────────────────────────────────────────
    { 名称: '辟谷丹', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/XWK3w4z3bbNER31DiaXX8eCmeukSVeaP.png' },
    { 名称: '回气丹', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/iOI7QJhRMtmPFQ5RpmzTV7XPRtIYUuva.png' },
    { 名称: '凝元丹', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/3cuViXS52UjwT6c3erEX0VtLxoYHqcXZ.png' },
    { 名称: '破境丹', 类型: '消耗品', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/AOsamqIPYbC8unF50YkbxJFTyT5hgBrN.png' },
    { 名称: '大还丹', 类型: '消耗品', 品质: '绝世', 图片URL: 'https://cdn.nodeimage.com/i/I1472tZCXFHs96mDvLnCUwmKGAuaYGRy.png' },
    { 名称: '金创药', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/WAqO08RTtk2UF0LJuXYgLKqiQfZNgRRc.png' },
    { 名称: '解毒散', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/pqcYHcHqzGmjTSWJBXQFLh4XDmy2XygN.png' },
    { 名称: '续命丹', 类型: '消耗品', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/qi3u9qCDAFecpGqj9Z5PVhCb9oofe7JK.png' },

    // ─── 材料 ───────────────────────────────────────────────────────────
    { 名称: '寒铁矿', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/mGLwH32nc9VNsboIhD7xvjvIYBXYA4lm.png' },
    { 名称: '千年灵芝', 类型: '材料', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/MMPlyo9f0U2Jrw60KuYncuv39KeEAVqP.png' },
    { 名称: '蛇胆', 类型: '材料', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/iVhMStFXnGRsFVgPYViEjVKWXXZAYKnb.png' },
    { 名称: '玄冰石', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/Qn4rxwZJcKeEVmmoDSoPY6qkGfq4KAUA.png' },
    { 名称: '百年何首乌', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/fe1IPvpY0EJfOsVNNCbK9jX66veP319X.png' },
    { 名称: '铁木', 类型: '材料', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/D3TfuZkkVScn5UcVid9gKez4hrWgn1we.png' },
    { 名称: '兽皮', 类型: '材料', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/bPFPdgrDmHm27O7CBGToqYDPuUAn0ZK9.png' },

    // ─── 秘籍 ───────────────────────────────────────────────────────────
    { 名称: '基础剑法残卷', 类型: '秘籍', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/vGzsBX3hrLq0oyAwTkiW1OEelMlFYXDM.png' },
    { 名称: '吐纳心法', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/mk6nuWDOjTTMpgC5BtGjwniDLvlSIjDu.png' },
    { 名称: '轻身术', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/hMQ1LwlpqUKOZlv5eL4wYat7ieKyDuEi.png' },
    { 名称: '金钟罩', 类型: '秘籍', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/cj8OCtwjGjUGs6PD2VophMw7E95fXc6r.png' },
    { 名称: '九阳真经', 类型: '秘籍', 品质: '传说', 图片URL: 'https://cdn.nodeimage.com/i/fLQqA9lhTGG37pv02U8Kg2GdQslEdjXc.png' },

    // ─── 饰品 ───────────────────────────────────────────────────────────
    { 名称: '玉佩', 类型: '饰品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/HJnTEVYHICxUwQH7DSkiYmSQFAJ255TD.png' },
    { 名称: '银簪', 类型: '饰品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/KDotpMKQjS9unuMZHSRy0Lqs5XlrXULO.png' },
    { 名称: '护身符', 类型: '饰品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/P8EG2oiUCle0LPrOI2o4TvKVPXfyYHNi.png' },
    { 名称: '夜明珠', 类型: '饰品', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/ByZlRD1cuBgLT0EypMBV6sFc1IYc9VOl.png' },

    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/OqaIas5ziOx5zXXdbxEYpJbPNmgVJtuJ.png' },
    { 名称: '铁剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/zl7zvvnXX4HVAoGmNZiSXpYElmQ3m21Y.png' },
    { 名称: '钢剑', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/xdNaMzdjtGikTaB0aavNoJSRz0uyBCXE.png' },
    { 名称: '钢盔甲', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/xUgeuD7TsVLxIodngaKXVkgqgFRh2pi3.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木长剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/JeahIg5AoKGywWXXefBEtKJZzYXuQN46.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木短剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/nl5RZSyBKKiZm1NPzSzmx0F0JQaoKS7Z.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/rRBsMB8OxuvZnrQSxwDYLR1xxBu8DGPB.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木短刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/452VGoGrwRpgEUJElvK6LwDzfo64oB1t.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木匕首', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/MsxZqxo5Kt5j2G9wnVXe8UYcZOPoLUzM.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木枪', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/R8SsUP0c4jvN9E3SejtwHZdyaeqK7Xc6.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木矛', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/LIFwGyrwwTXDdD7RZl5bkIcaW2QhAUFp.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木棍', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/qoy7VuNgO9Jlhc2cFbHWbhyesaCNdWJ4.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木杖', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/uHdetTUWiTjuDBlOgz4UeMykONSh6ucZ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木弓', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/1uU1WkjzCcj7p7w0DgzNEtiaic2jANfm.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木弩', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/SO8Fl9wFoiH5sdPkHCkgYrs6rUhginvf.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木飞刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/J6W1UD4h1mGjl5sTzdYibj8ojM3i98hL.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '木袖箭', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/2XUFxajKR7Y1krwNK2GPZxbxiCBNIho6.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/Gbs3mQIyzbx8duFJHamM4giiO2S3zbwz.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹长剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/pG1V9dp8hU2oGDVGt2ZODmLyMoS2cyxR.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹短剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/blFr4Kr6Eib29O7OH3UlicWBYFM3MEVO.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/ET3ZnfCsyOjqicqmDvvvE7D0PiaXT37H.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹短刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/AKxkG6ohmObq689htqKqLFklbFO0HLH2.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹匕首', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/asUVw6jlfjh6VgwKMWUagYItaR4EYXJJ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹枪', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/noT980kYqHwRYKczuLG8NFiRzjRoXggf.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹矛', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/hZV2ZFbQvXGyyDjLXMu5PdhHJXJHY4sc.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹棍', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/FUiFAFTmChmcDjaVOXjxsQ7uLHqbRE5A.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹杖', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/931DiGpQOlceJnV4Z4iHYK2AVdQPMFMn.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹弓', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/xSMzvWuIIxmU2EpZHI8XBOuEi4i7obpG.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹弩', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/0FxDkUo9zKqZ8Y9cEaMWYA2M9J5YD749.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹飞刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/g2KjCnztD5X0UZ1i6SH7lQgZvkoXFwMR.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '竹袖箭', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/aWgesE7514PLyCdVw3xJh7yddnXXegtq.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁长剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/j2CVc1eeQIbvl0YWE5n8PnN4mhzbICKe.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁短剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/ipBmaK82NJ49waQH7OD0O4nznyzy49Sy.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/XSinoQTTjRntZ5ahOVyFyswEIRjRko10.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁短刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/kILMjx2fO0lTjSovoBaspdVNdibmCkJg.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁匕首', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/TnluSKAQloEKFeyMs18AJjNQN6NULD7D.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁枪', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/FG5Y14yQgVlzG0NYkmVXXt9BHVTZUiMA.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁矛', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/iJQOPll8G2fzTxvD6tR8soqSgnhxlicf.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁棍', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/Uw64F6DrPNjxfSClii4llXYAZWEbAYr5.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁杖', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/kVlnGKA1zFdVIbyqnQeP1zvY3XXN2Cs3.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁弓', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/xkFrdCrkdfxDZA7gYImpO1F2hYLLBmtF.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁弩', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/tDI2x8hXLuGVeL5kEXUY0VygJjQniZk6.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁飞刀', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/JGGw1kf7m2Y5kaxvFgiEYbq2viDfIaXq.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁袖箭', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/Wx1GvvpBehxNXBV6moeNB4HaoEe6K24W.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢长剑', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/3q6mccDXIs5HwLCbzxGxwNIgW6Xc7JGw.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢短剑', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/XrBeVp8loT7rNuQOczLkOVTmNoyjzcXh.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢刀', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/QDCUJVeCwidpyIYECrVie9KyXPUYTjgq.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢短刀', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/17fNsyVzt6IbLoZYqD6FXXLFHESl35Ka.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢匕首', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/bs55dYyqfGBU2ENejpB6zMeHzoIejvlH.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢枪', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/R6qNfDRiy7gR3jL0Axfcg5dRdTxVlggi.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢矛', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/5l1dZKpKnJqwgJV4domRQWenxAIfGNg5.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢棍', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/bwK1LfzzpSQutw1poXRcKwMuSdzjsCRL.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢杖', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/ASPI3L9rpUbSj56IbUZ7uoKPtIp2MgVw.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢弓', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/uxS0GE0snSvb033FErXIvkHwMd71XMsv.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢弩', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/tvVet3bKr8SJlIjBVYHWWoUA1eTrOXd9.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢飞刀', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/tErF5zXU850ugWIgpu0lwalK9bc6Kagl.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢袖箭', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/NSUbJbjW6RML81w086h5rHAn2yOXXGq6.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢剑', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/1DQNX8ltfRNTnmvvgW3SOzElwO5EVWSK.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢短剑', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/60YS8AxSkIJTjOuesIsaGhmQYIt0U1OZ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢刀', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/Tt6fTID9M9yqlpCRgLuHrXePEBD9F88F.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢短刀', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/ynHy6isb24hC8ReqQuQ314Q91NBUdmho.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢匕首', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/KOmQP6OaiRYZzWUW87Kz4gEQ0Ioj0hoY.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢枪', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/4DxPICo1zECsoB9MHtBlqgdtCMXuHuaR.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢矛', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/zz2a1BGj5VjBoBJURcrBpWhlHq45j7MN.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢棍', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/8xKfUBzfOw6mur12UAPwlHPV2jQxWdY1.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢杖', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/a4Fe8drrBl81At7OwTL1w7ZJRvd2NPxw.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢弓', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/9b015EtDzUTPvsTWYG1mQfQWMC9yb1ej.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢弩', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/P82CQvGzOpw7LNJTmfN3GyL7BpKpP3TX.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢飞刀', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/STjGBQMBFSRygOi8KQwLG0Uvy45AuTVB.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢袖箭', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/KHEjpki0SsrFIGrU0RKeDjt37nmlE8LE.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁剑', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/5kVJCqbi2IrV35jRCY3x8TZwJpwaUf8Y.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁长剑', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/ssVNKBbHpnZZ2EjZSXsAHV5pMoCQD74G.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁短剑', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/jq27naG8WFZHzDJHS88lXoqsE1GEXXAD.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁刀', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/iADBEHq6C1LaU90zI7t8HF3LsTXPzCn6.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁短刀', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/yVRT8Kv5s3FnWwtjlKHezQLxehYoMrW1.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁匕首', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/MrmzMoO77dNtPJUf9MQnQghRgixULRDj.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁枪', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/cehIvpFxo3yDUagu2I05dxCOVnpJ1Xpa.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁矛', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/BHkmX06vloHLoxz9jAYmoEzvw7ZupTOL.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁棍', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/SkF3FUrCVCxh4S7eEupATUZpjyDlUwkT.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁杖', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/3V4rvqZTnyArXKmsEFtKGXyqRXYxlrXs.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁弓', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/bdqWFbRgOkYzfALceiHQXWS4evIzFqQt.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁弩', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/rfulDcSKR7MzV3cdGngd6MYAoF8akkBi.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁飞刀', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/NVfBkbV9pxvoCYZI2zfPn37aR9U52FlW.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁袖箭', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/cTkVsP64zvjQoDzLCpZgWYR7lOqWgMJY.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁剑', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/Boc4WKHnooyJLfWrU3ZzdIRBDYaY0QFp.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁长剑', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/BrE9Riif9pQH2Yr6YtE2y40j5JH2AqVY.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁短剑', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/VAh9t1FECteJZ0ge8rfIFRhrgNjFwYYZ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁刀', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/00N6bLda8zIaZXBt6LKKb2XnNJjsllmm.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁短刀', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/eTWhHU4PlZCNkEsHwSB73r66KrJ5Frmg.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁匕首', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/R7FLsYrjo0Tjee7EoEk8IoEMAKYXhUVf.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁枪', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/ZiB8jo8HXO6K67QgezUUdsSiQFfnnDY7.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁矛', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/C7frEFV8xj7ivKZBXtfTgvpLvpChAe7b.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁棍', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/FlEjJEiVhPA7yCr3OilcUJQuXj6xR6W5.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁杖', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/IER4rGvRWm5n5stgfANI6nTXCNxCN2Xg.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁弓', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/YyFYkzrpxfM9Er78Yq3LVPYFtMJNzhV4.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁弩', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/px9nVsQnMv2W4hkLkfZXrvkgiFc2AXnQ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁飞刀', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/7PnymQYU5gtdg7HZiWc4N5EOInPNO0VE.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁袖箭', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/WUo8l5K7BfRskLMTicqDpu0UsGmYYRMf.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金剑', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/0167ADDjGZ2D7CC48svkyCJq1GfQqf4D.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金长剑', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/504QodZWlrVyMhmONh3ZVYgbIWxhJVTT.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金短剑', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/iT9h2dQWBzMa1YkfHIY128WdgfaYFzyB.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金刀', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/U7dQ9dUl7BPxLBlUQr0SHzL9qyFV4YoI.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金短刀', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/Td5LlQyOTJaGJ6N9IU6Y2McbFW9KEzKg.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金匕首', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/PDog8OKR3mHuPjMcR4ztM7X5kCUaLo5w.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金枪', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/jLPOkT9x5pWIVE62e6X6uwWshDqtEhFj.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金矛', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/3vD5Taqhl3B1ul0FiTxL5JXUfUFgZOHn.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金棍', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/piXLFdmcD4ypqWs1d5pUbKUThOSao1Aj.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金杖', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/fK6Zz4DLWQm1RcCaP76j4CY95CCJd0j5.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金弓', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/EGEukoi66cAQzhrv9qp1aeoGcbu6sDcw.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金弩', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/iTlHjVAwWHbzAMy3YiUV8UgzLLdetINr.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金飞刀', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/kpqd84RRAfyFnHLAx2DXTHkDn8nBcfRv.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金袖箭', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/lW5dJayfs1bBwZNpXJTsXBwiLoroP2hj.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '粗布鞋', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/VO0kPQtVFo8QqwTXXgftyj8jgbksjdke.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '粗布长衫', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/D3CbKleMAMOKUvYKOnf1KTuyhudgKZa5.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '粗布练功服', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/luJKuFcLz8wSBuKDNXtWtylQvt1PHKh8.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '布鞋', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/0SPq2D96uTEIAa66lXTHot1rhfXF7pUr.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '布长衫', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/ZWuWC5SxqssKkVcOF1ENvxHsHc07AOlv.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '布练功服', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/NSePt0JCUTrmjPblNWC9UfJsX7kjuHsI.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '布长裤', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/8fpm1SWpTPVyaL83b5Fgbc9TrXTbfDwx.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮护甲', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/Z691irQSc8y3ETkrHNYvoyWrXlJdPGk4.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮软甲', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/gc1eIypQwwdTYvV5D530Z9DWCHvuyi0O.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮护腕', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/SzPimL9JvaVA0j6btmLHDFMDUIevmDT8.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮护腿', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/sI3x3wCNQfc2eZqaXx7IMcdk8GmL874b.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮护膝', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/irL8zh2jo6hWDuoRQeCEGuL0TqlmDQ6R.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮靴', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/E2suLPIACADnvpF45X6763lhwtnRKLjR.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮鞋', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/AU3xdJCCZHMKanqQbYAxSOB7UQGQ8FIn.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁盔甲', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/hZKcWIzeIWZdzb19X2Es0EIQTliSv1nN.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁护甲', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/K4fX2BV6MoUUhUZeqjwxKQfJ9siFJcwx.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁软甲', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/NCsTUTIivyD6k6FpytWeDh5lLBeM2KJ4.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁护腕', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/mdndebYIyS4JoHHRXMhSTI2qPjhuD0Ay.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁护腿', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/YMnhgWY4XfXP9FHa8lq7Eyg8oKdEKbKi.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁护膝', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/f1ctmkHSfoe2EFW9eYEpPE8OUf1mfuqY.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁头盔', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/0PBxal8MGPasYdQ9XChD22Bn0hQ1YYVZ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁发冠', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/E5n0YlYPSHAuqXHhzmNoj46Xa9TCso9e.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢护甲', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/nMFFycrcG7jwL97fObmTDyJfl0OJin14.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢软甲', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/mcKRG6zouYjHYX1KjVuokWtjgVtyGyUg.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢护腕', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/sDK8h0zakOwovI1xpumBO1c14yP5C9uK.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢护腿', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/Q8dEkeUQNOFc86lGSosA6Tsr9gpXmJ3S.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢护膝', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/2pfsm7VJTd4rusZY7RnBrrwTVzrp8InJ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢头盔', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/amhi9CFR3ybBtMgnvsgJYwk6Zz743qlg.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢发冠', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/9eGJ4df5AKWVdtx7YoVGXV8OXnyhhXW7.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢盔甲', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/HpfIGmVaPOqxiQZgpeCcsLL35fkst2K3.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢护甲', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/Fnn2JKYGQdEgzFHNM2fMca8leGHHRHIw.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢软甲', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/OdPbzH9kl35HhV6ib5s4sKpqggQByoIi.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢护腕', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/1a8SKKwgsTXwbNPO9xuC8OrBQcOaSJJ2.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢护腿', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/KUR8DmvXfSElyBtNPQyvtNfqoKOkZtWo.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢护膝', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/bawhw9E5PF2As3DtzoQuZOduSkOV1PNB.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢头盔', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/Yz6eiqDbfePKPVCjgQgVqTffiAK2hIS3.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢发冠', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/tr23YkGyivP2prJSmXgs6JLNlYH8C6WP.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁盔甲', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/pLmev0OgGGr16bUoiPMOyhFJ3FXvzf3V.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁护甲', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/136NPqDGMaOevMChbuAcp20M3YE7MCjO.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁软甲', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/Sl8Z3RwAT6fgokPXMFDdLkWuTyUhqT3p.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁护腕', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/icWF8R4nrCTC8pseZsXfxTkRv3tzp9h8.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁护腿', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/GtQGxJlkldAV9BvrDzBHPhoN7BDkCYe9.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁护膝', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/ytbArRPljPsxCbf3OLFIFkNYzUuYXoYL.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁头盔', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/sfzVFT30RW39sSAX5QDwLgBWE3ABDUmH.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁发冠', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/nLKCN2z09hEaVC1xlYmwk2kM3NtUDlYr.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁盔甲', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/ScjpXiMeEvIDRoiReVWzP9NXj7QStkXd.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁软甲', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/J7ya0ONyGNBB672YYPGqQFXfKwmOOLXu.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁护腕', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/waJ0Ygc38MqdchKWpmt3bRfAXhXsLN7L.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁护腿', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/uakoRL6Qcv2lxuzJB81evYPSxQ7Wu5Ua.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁护膝', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/kOnuc4YnzG6izlHHTgnUoEEMKFncoCG1.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁头盔', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/Z40nbJtQ4TLZNxT9U5Q94wObM0Vm9MPL.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁发冠', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/wfWuMQ4jc76U0rs9KcVqUobpyeQGsWeI.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金盔甲', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/SR5GZSyz1OoMPsN7uOXZl12yuCif0QUI.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金护甲', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/BTcZeRHxRo2ZxRW91nAan3VqJOIoaxwQ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金软甲', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/uP6VNUD1BYB2vuCckjXgaRQJmqAZA8rt.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金护腕', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/X54KQQZbF7eINmmRApUPIn5rJRZXyLYP.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金护腿', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/xHy7fXN5oLsa5524JHvM7YX4LgzCVyKq.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金护膝', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/ASSms30qiAAyv734RdkCD07PNS7lKiuF.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金头盔', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/2N3cQoCFq4lfLHqvbtuxNs0xgIppgmMP.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金发冠', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/2TVhyCbluwNDxGjLh7lW5b4a6ixLmdyg.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '草鞋', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/JSVZlrbEdEWViCjkXiKLrUT0IQ2boXMM.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁靴', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/oSZzjZ1GcB3OzVEgVRmI6S9GGaZsTkgg.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁鞋', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/qZZcGw1eFhfNTAEDlxFJwMi1m1YN11tU.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢靴', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/JJyE0PN8R4r4xE2jBu70vEkLVtAJM302.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '钢鞋', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/cnRkBivcUnJdBZt3ymaU4FYx9kGWHMUH.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢靴', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/ung3tX7xe8MU2Gd3myFNYAdcVxJiSxhE.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精钢鞋', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/HCq7quRuQidW0rLLHd8zCCSEY1ZUQpUf.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁靴', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/hXL4kG2HbeFXMvojKhiGBAk7PdmukDVd.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '寒铁鞋', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/JaaJjV5U0E2fpiXP6LqFvHl3VwSEH709.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁靴', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/i2YznTxGqcM36mudgZKBWdcwFg4yFIem.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '玄铁鞋', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/laxxLdoQYxys0b9O0iZUdMzY6FVKxlAE.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金靴', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/ehaVBB5RxJPBEYXKsqFelTieywKojP1g.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '乌金鞋', 类型: '防具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/UzsvAtILzzRH4FF9u3dMYTwBwTbAh9Gi.png' },
    // ─── 仙侠预设：丹药/材料/秘籍/符箓/法宝/装备 ─────────────────────────
    { 名称: '引气丹', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/V3clmaHRB3aZOrWsAI96xoMbK60sm1rw.png' },
    { 名称: '聚灵丹', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/Yv7eIKnb7j3yPqGk9RnypoqoPp1hNp7G.png' },
    { 名称: '筑基丹', 类型: '消耗品', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/1EdF1yU0VWw3Z9lEAb6fBcrK1fAgyYuu.png' },
    { 名称: '结金丹', 类型: '消耗品', 品质: '绝世', 图片URL: 'https://cdn.nodeimage.com/i/EN8q4NwERtsxmRPYewZrkJDrRVnXmY8X.png' },
    { 名称: '凝婴丹', 类型: '消耗品', 品质: '传说', 图片URL: 'https://cdn.nodeimage.com/i/oQnmoDYDEzNrC9HWox3sA5H18usTAvpA.png' },
    { 名称: '化神丹', 类型: '消耗品', 品质: '传说', 图片URL: 'https://cdn.nodeimage.com/i/QXH2ZCsJ4XCdUDelZHNmXX9CKLIhDXa7.png' },
    { 名称: '清心丹', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/fXVlypbKkmzfiqjtNe3ED3CgKFaeTPWU.png' },
    { 名称: '玉骨扇', 类型: '法宝', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/oSLva32lRDDhZ2oT9mQeNGCMTEzYNZwX.png' },
    { 名称: '淬体丹', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/G0G92cfgq7IQ6fxRx0tUk77tEFKNysZ9.png' },
    { 名称: '洗髓丹', 类型: '消耗品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/JOoHJDK9uN7XweM6MpPQXDsTMD4ejKrJ.png' },
    { 名称: '护脉丹', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/ugyStaNJ9eC7gK2U3tsoYKWOv9iPbT9U.png' },
    { 名称: '回灵丹', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/NbQj0alAk3Fw0vvA5qNf7lER2kzK9BSj.png' },
    { 名称: '培元丹', 类型: '消耗品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/9lDgPdqmKqytj50feTqEkPsF4tVQGD7h.png' },
    { 名称: '下品灵石', 类型: '材料', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/dOWxOD4bpvNl2Ysyui2EjC36pFkAsVSY.png' },
    { 名称: '中品灵石', 类型: '材料', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/XT5wa3yJN0Pov7NFu2L1QQUeRFqXWOFI.png' },
    { 名称: '上品灵石', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/xZHvaFsWK3NjDretj7Fc9dnV7xSTxbpV.png' },
    { 名称: '极品灵石', 类型: '材料', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/h42c3ZGPyxUe5fJ9oFvQs0EaK0PQmX7Q.png' },
    { 名称: '灵晶', 类型: '材料', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/nlgwkl7VeRqKtNdutzcK8QrEbZT7CVyS.png' },
    { 名称: '赤阳石', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/cehnGwFj6Wj8NkgF141otFnrb4V2D1dq.png' },
    { 名称: '星辰砂', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/RHiWG4TNKalH7eayGawFV010HQ5CXYwh.png' },
    { 名称: '空冥石', 类型: '材料', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/bRTCvhklBPzgAncHRBIfxBXd2BoygjE1.png' },
    { 名称: '雷击木', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/AoxuUKo1jQn6Cg9gEmVkbaO8i4Tj3RWY.png' },
    { 名称: '灵竹', 类型: '材料', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/7jEbAKiJIayvhArmKsUNrAudvnPjLO96.png' },
    { 名称: '月华草', 类型: '材料', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/7Ycpg3HNx7ExJiWFV9120VSa7rcYXkJE.png' },
    { 名称: '凝露草', 类型: '材料', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/nb46T7ZPx2S3BdmM2uXm5EukV4zAarCN.png' },
    { 名称: '血参', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/DvDS5Qq2lEF5xu07y5kUZiS8YtR1joNw.png' },
    { 名称: '朱果', 类型: '材料', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/DJKx7PzxjzsorT19rpjcSYbo2VCSaVZI.png' },
    { 名称: '妖丹', 类型: '材料', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/kcxNiWobGeIwHx9HRtKANBrA5u39nCPu.png' },
    { 名称: '炼气诀', 类型: '秘籍', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/64I9pkhCfUL7r75q89oi570cuC2CGqzY.png' },
    { 名称: '筑基心得', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/c3o6X9KA2AURJiMigN1TsnssOl7Izbg1.png' },
    { 名称: '御剑术', 类型: '秘籍', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/4gr2elXexUGV3GIvNCqCvlKEHuD5PJsx.png' },
    { 名称: '小五行术', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/DDckGkHjSjCyG7WPFflbFmhayXlURn0X.png' },
    { 名称: '太乙剑诀', 类型: '秘籍', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/8jZNeB1NCbeyqmEap5lSb7x5oziAVj7D.png' },
    { 名称: '炼丹初解', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/T7QBbplop3Omv9vgYTIAJR2p6N0tfaGr.png' },
    { 名称: '符箓入门', 类型: '秘籍', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/TeNlZmdQOxumZiBSqha3FYkY7Ho4cxPh.png' },
    { 名称: '火球符', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/g7S5Lq0qF1RoBk3tBj6scFF6NYk7HaXK.png' },
    { 名称: '冰锥符', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/nDZVkr16BHrQzoEh0VBz7eGWxD5Ny6Sr.png' },
    { 名称: '雷光符', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/SysWeKILdTltgeFMkfXJTaiWXiX9QxGI.png' },
    { 名称: '金刚符', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/rcTHC5kTnMelTqcMwjd6wFjpVAUp2jLn.png' },
    { 名称: '神行符', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/T27V4en5YJteBMGwmakkQjw9r6owed0o.png' },
    { 名称: '隐身符', 类型: '消耗品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/7yiGJNTxAQY4x4apjJO1mfBY7x2NXa3m.png' },
    { 名称: '传音符', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/YYvPbgBJiWyr3unFNIC62FqsEgysP0vr.png' },
    { 名称: '传送符', 类型: '消耗品', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/vECs7keKVplJ0zYD4O33kczbMsJ1h9jw.png' },
    { 名称: '青竹飞剑', 类型: '法宝', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/6GF8B6rd3tpznd79gZgX4XktnaphBodE.png' },
    { 名称: '寒霜飞剑', 类型: '法宝', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/rax49NohyM6rK49cq0HMXzakKpJpD3JX.png' },
    { 名称: '紫电飞剑', 类型: '法宝', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/nKLGlJ2xbc8307oSmnQk2xtM65H4reK1.png' },
    { 名称: '青玉葫芦', 类型: '法宝', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/S8YZQpxMG1bU2EuoIwXXmz0TxnwIakty.png' },
    { 名称: '养魂铃', 类型: '法宝', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/LiRk3RvdKmXSQVtSDOG8vuxs0YxRQKba.png' },
    { 名称: '镇魂铃', 类型: '法宝', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/JzqH9aRSYTVBECLdNdvMnIoyrL2RbGkF.png' },
    { 名称: '玄光镜', 类型: '法宝', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/64hIolFNMyh42ogsD6U0gppEFAlic0Ak.png' },
    { 名称: '八卦镜', 类型: '法宝', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/GjCufaek8g2HuPYvcYeOCR4PEnv2hQRm.png' },
    { 名称: '缚妖索', 类型: '法宝', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/GeN7LNdOC5loiSBdprXqKtY23Zyx1hSX.png' },
    { 名称: '储物袋', 类型: '法宝', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/cQSB7M0jvhr8hI37GAX8mTfSurBtV20w.png' },
    { 名称: '储物戒', 类型: '法宝', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/XSz4vB3QM3DExnADKNS5pnx60dCmQX4g.png' },
    { 名称: '灵兽袋', 类型: '法宝', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/uOBSNt8xPL3DzgQpGnXfftNLeNJZEWST.png' },
    { 名称: '聚灵阵盘', 类型: '法宝', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/5Rgaok7xyagZfzdeXtpXm4BGOBXZBHja.png' },
    { 名称: '护山阵盘', 类型: '法宝', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/r5Q8ABlPwcqK8ov34DSl8sahejhdETA8.png' },
    { 名称: '寻灵罗盘', 类型: '法宝', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/RvCpaweyOsfus9Yn2toPkn3rwhSX10bB.png' },
    { 名称: '紫铜丹炉', 类型: '法宝', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/vk4SRfZGHey59jmNk4w5Z9EawNow1jGL.png' },
    { 名称: '玄铁丹炉', 类型: '法宝', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/eeAjvYaOcXNyPrhT4eMPesVQZ3jf6IHp.png' },
    { 名称: '炼器锤', 类型: '法宝', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/scA5qwao2ePyFChWttYEfky18EBmupkD.png' },
    { 名称: '青云法袍', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/UZ3at9CkwJMrZuqlTsLGXA04XUQL82Yl.png' },
    { 名称: '月白法袍', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/Oa1TpBpJCYflw3VnktfCGPYx17ihLgPO.png' },
    { 名称: '玄纹法冠', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/siVpjMblciOPqvj4CVEhdZ8Y0FJgSdXc.png' },
    { 名称: '避尘靴', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/NQsQoII49GILr4Fe4LcPjamn2gQHfz1f.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '门派令牌', 类型: '任务道具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/8PiPD8To964DUiaTQ3Xi50chnFAazpCS.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铜钥匙', 类型: '任务道具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/MpTNq2koqeElkFcUWFmiyc2bY8q3ASaW.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '秘境钥匙', 类型: '任务道具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/yjDhEjqxvHo2rz0WK3E86DXwuHyg8vXp.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '官府文牒', 类型: '任务道具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/UpukugSoekEhHfcwP4u5XIG0bSlgmqha.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '宗门令牌', 类型: '任务道具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/h6IG5rh0y2zTFA5DoEL1pbq2434EeTcP.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '智能手机', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/rObLT1Pbg4LdJtfVu7bafp9h8L6P97X9.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '洞府禁牌', 类型: '任务道具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/hA7gLFnSODNDdPGtvYhzD19t34PBtpD2.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '急救包', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/CxpurBWWP6q28h8dE6NH40dAs3AYYh97.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '录音笔', 类型: '杂物', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/RClShWAatg6IeyyrOE3wI65txV3YfMEi.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '笔记本电脑', 类型: '杂物', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/ImRnq5vCXseekitGA3t4jb5zYBn1MY25.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '镖局凭证', 类型: '任务道具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/aBQOKplSA7GZ4YvMf8QevcODcIgkbEgJ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '密函', 类型: '任务道具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/nApiF1WD0sP7bk8coCbckndYywjOXr5q.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '传承玉符', 类型: '任务道具', 品质: '绝世', 图片URL: 'https://cdn.nodeimage.com/i/GMekCeJpVSyldtbi7toiCNKMCHiT9jxO.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '防割手套', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/cbv1K5BG9Y3bLYn2jajiP5Grh7Lp9De1.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '银行卡', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/6e4aqRZV4rr5PSmC2LyXSonkONGFAU0i.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '古玉残佩', 类型: '饰品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/GIbX8kPBEWKXo9fT3K5aXOgXF5mmQ8fz.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '现金信封', 类型: '杂物', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/cqYfCsxQpje4rIuIqZX1AbckmsngMpsl.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '合同文件', 类型: '任务道具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/xgKyrfzM3KVdcm1sfXDfWgmfkX5eEI7o.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '证件夹', 类型: '任务道具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/K6fqxpVuPDPy8SZj8Q3YYeWu0X5VetGI.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '数据U盘', 类型: '任务道具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/akBRNB8mPxUiAPQLBCRJzUQPv73cQUy6.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '维修工具箱', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/5aaxHa5q2vVX3iX7u4azy6dhb7UQHISj.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '车钥匙', 类型: '任务道具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/gUf5AlVLuujSdXZj6KSjNrc5EkxhZ7x1.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '电子元件包', 类型: '材料', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/NEpJv7WNyYoLHU8wvHgAS1IbAuH6F9CH.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '多功能工具钳', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/vIbdvTPe7FgIXNf0Ns4EGLK1mXZ5tS9g.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '备用电池组', 类型: '材料', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/AjQm10lbljRVlOvcZZRhYzi7YJXnYaEJ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '防身喷雾', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/p5DH8nqXxe5x2K0QetHFab1WavyjIjM1.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '伸缩警棍', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/8E7lKpnBhEcCAuGSAtYm83ZxkcntMRlS.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '轻便夹克', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/9jFYy6rgg06Fpd7ncrbUcuqSHvtXz2XF.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '运动鞋', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/Bs9hYVQ0OF7fWzk9zFuOqs3bPYYskLGo.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '防护口罩', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/F5BBhX8SzpGwhvQ1P0WSk5aLneRXqMOr.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '电脑维修手册', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/qJhVXpFXbpY0P9g6a8nEsriPVXC4XsHh.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '急救手册', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/DrwDQQEirrY0RZDy1Romu10Oruovekz3.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '便携检测仪', 类型: '杂物', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/Afhz7HF2duCj42goXgxQOkruL5gWgxEM.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '防护服', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/vueeKNJIZXdk0mbOkUWqrDYwxhVsfy1t.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '异常样本盒', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/DnJZiNc7vItvmbKwclJubzvqUkYZHdsl.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '灵能探测器', 类型: '杂物', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/CFv3zQBpNL6WD2n8HX5riRdWbYcx9vtk.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '银戒指', 类型: '饰品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/ud3Vc5Ci3Ti51xqKGEyhX7e6n7ESlUyP.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '灵气抑制贴', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/I5WE3j4vAjfbfisSamCD1aO6J3jHEHKu.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '罐头包', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/86vf3aBHKbdFdVnWVYmITh8o2QRshsUK.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '怀表', 类型: '饰品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/Eeliy8AeFjKvsZyd2gvkaWDFj7AgBuQL.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '净水片', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/eumtYHOoOJMut0UpcgO1xCxRIeflnyGv.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '手摇电筒', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/TMH66Qsw742KCgeBmxBZBKaI39YATeUB.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '弩机组件', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/0sk5gD6YOYpWeFz1npmdlTppaSoGdIQW.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '抗生素散盒', 类型: '消耗品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/ROsc4oILy9yDlcFC9YKXiAc9G1MDWNGI.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '饮水瓶', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/5UQvv6l7ll0OfFvcPSJidkaZeGhjup1A.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '汽油桶', 类型: '材料', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/j9YuUwxco2esqYuR7XiWcwjjnTUnVXRX.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '压缩饼干', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/gwDuctqyf8va7V0ScDvbTvlJXkZWXorr.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '医用绷带', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/uh4RVkZ8OAwZGYmGesZp2V0yOQzmm428.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '止血带', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/E70fwht4w8q2bKTxys9hpPrjnP2E0i4Y.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '过滤水壶', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/DcjQGOMyv6NAsEixhGWOUkDHpaA2vDzh.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '干电池组', 类型: '材料', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/EkBIrZ8wW5adQ7QFHaHB9pZr3S118YvZ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '净水滤芯', 类型: '材料', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/2M9l6DQ7wJEHhOkukpJXBRhNRmsFSq7l.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '太阳能充电板', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/Hk7mVwnMHPzu3yGkg9yZ1X0vDj6B18px.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '弹药盒', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/OubYz0PnUBwNJPfXlKOi0Ft1DFBVskhU.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '护目镜', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/ZD3xBCCUgYRAOMq2KeiJ8vtI7mnxbTw7.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '防毒面具', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/PTFufxrkHtin7s79A3EfRtKw1dagb2aX.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '撬棍', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/oZaizw5AnqBRr5Xaokpe9h9l8enHwTrB.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '战术背心', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/OrBhbb8l0XlubwQQPyvFI3WDIqbs0CYs.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '消音弩', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/o89UIwQnaDfzA0kBK2dEpuJiy4po0U07.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '求生手册', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/wenmlDY7vILoDfHjxDR4ryRwwRY5B1G0.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '营地通行证', 类型: '任务道具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/8tz60m3jgGRyB6AOPivifFudCPyZ1L5o.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '无线电台', 类型: '杂物', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/iUlVyKA0VrtHjwyfNJeQxoXJaVfy04Kp.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '防水火柴', 类型: '杂物', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/KWBkNF8PcK557VQzJ3prqryqvSOglR0j.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '感染检测卡', 类型: '任务道具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/YgvyDiBU9WtplwnXlUViRgopXi5YL3fg.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '骑士长剑', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/MvhJ8yFAJPlQUzgrA2cN6odIjxKToWm7.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '冒险者短剑', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/laUFDTj3CxP8NSwL0JaxunyniOkRxI4g.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '牧师钉头锤', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/91bIbuPVJNnpfJfb912tgExaMEq9SR4D.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '橡木法杖', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/6Ts77JIPMyTngWF7bYXQXWmcByOxSS9r.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '长矛', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/gppvI9Wzmuephi8y4RjnSsjXoy6XDIDd.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '轻弩', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/6i1lxVpsKoz5jkVV6vpYbPDVrxfY3TM1.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '猎人匕首', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/1qzQMB367rQjvaA6BXy8F5wkvOxr3x0A.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '战斧', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/WPCKPQeR62ZANtYGNaVY23UyK5KfgerX.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '短弓', 类型: '武器', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/FT5HySyHjfgLnNNFquggXj5OrLTAF65I.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '圆盾', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/WvF3qJrMuUXaVy78mqIKIhkMXqoK0vB9.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '皮甲', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/Hn0Q2rtK5NArPdTAak4NILmOcvvmZq6T.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁盔', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/6fcprdH2HEtzg4Ws1vasZdm4RDDazFxl.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '板甲胸甲', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/2psR7JIeXWHLAyFVdrcoUdHCJEaGPpht.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '旅行干粮', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/HH6Rj7DLt5RUL8Cjf7CtEYUCF4zj4mfr.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '兜帽披风', 类型: '防具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/0QgTbW7wOY1JkwdH9w40wrKyRCAOfgEd.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '治疗药水', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/0drf4XXXnXGIGGIz0cEM2ULJNFIsHqje.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '清水水囊', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/X4Dgznqajtv6Fx0iMz2X5jYNF8rcdu7n.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '法力药水', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/1kyzpwNcoDQvq82Sgp1Iug0e076hgQuJ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '解毒药剂', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/2BZkqH142CTRkzEtU43EPpPPLuZeN9JU.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '火把', 类型: '杂物', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/6aFMTvrrMtM7Rt7QSGNp02sJXf38YDDA.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '火绒盒', 类型: '杂物', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/5SsjzzIZ5lyauPFttgxobIye0de4tAui.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '王国地图', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/daYe0OxCqRKwOsub02vC1umdAjWd4uVw.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '冒险者绳索', 类型: '杂物', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/6JY0M8xG68M0hGuI49Q7ZQSihMUiT49Z.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '公会徽章', 类型: '饰品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/s9CWSBeveCLWGcY1deUyIHbDFjatQ9Jw.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '指南针', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/lrh6TxF2AhHlPmgr38X1UV66OaDt69qv.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '护佑圣徽', 类型: '饰品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/3A2CjfGG73m3gTJHKRnspdPpIRAJJHmb.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '魔晶吊坠', 类型: '饰品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/e2Och1g2VRq6yftEhHP45oN5ru1xOylP.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铁矿石', 类型: '材料', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/qNdzvLU16VpOgwlaRXLMVOsvLCkCG61s.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '家族纹章戒指', 类型: '饰品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/ocb58qPTfM7zayf27Y3qYwROvYdO9rXF.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '秘银矿石', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/ajlpP4AvZYuB8KyhNZB4OWg8SXpveDNn.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '魔晶', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/gwCyhee2fjbLDtYt8Fc1Q41Mtevm4PO7.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '龙鳞', 类型: '材料', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/W9o2dDKkZ5dzXGMBp4krptLWzO0VVuza.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '狼皮', 类型: '材料', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/p3FnANr4YZdnjz7kFdoLbNdjZuhNtD74.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '初级魔法书', 类型: '秘籍', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/U8NmJSd4ZuZ0Y4BuKXOOepIVnUAuRUW1.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '银叶草', 类型: '材料', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/DgZCb41ROL5vfAE9heUQrLNLpt0n9HyH.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '火球术卷轴', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/broz7eKqxrfB7ZMDPIHG5H1hTvwHg7QT.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '治疗祷文', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/FpS7dX00UnGGl03xmYzlwUcTxOMpOXNC.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '委托羊皮卷', 类型: '任务道具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/VLZpNH1bmLQfHFEF1IAPKz5ElvUq4eiU.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '炼金笔记', 类型: '秘籍', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/ssJ35Ocg72RQnIK8knfOtDogKZ2xsvtx.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '地牢钥匙', 类型: '任务道具', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/LG94sYQqa9ZpZgknPmCFZ9doHzzrwTFJ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '冒险者执照', 类型: '任务道具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/86JRDHc8PdGzfiK7vIJTgjOHgykCbzGw.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '铜币袋', 类型: '杂物', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/t9QYdRlipo3nMAvFH8BVEyvWCFN7PC2M.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '银币袋', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/jC3YrqCOn421Z0qyRZIZycWpuoexzEUJ.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '金币袋', 类型: '杂物', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/aQlE6MAnRL8HbCyqwsHyhnY4mTvrEkWG.png' },
    // ─── 无限流预设物品（gpt-image2）──────────────────────────────
    { 名称: '消音手枪', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/qb0ZWFtugESSQoT4dbpaYTwPZYJCAkZ0.png' },
    { 名称: '战术匕首', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/Pi16DFp0zLMahbVqHaAAey89lJYhr34N.png' },
    { 名称: '折叠弩', 类型: '武器', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/V6C5adeukO1HmeY4R8dIurKtGwcMZvF3.png' },
    { 名称: '高周波短刃', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/5LPPzS9oVUHPSi6CR6X613y5cpnyG7QG.png' },
    { 名称: '电磁脉冲枪', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/gDfdPOV4mXT7zsZRg4XXeGiKeXY1JxMi.png' },
    { 名称: '防弹背心', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/9sfYonVU5wUWaUZcSEclF1AQlzFfXDgw.png' },
    { 名称: '作战靴', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/YIS5vz0gghecl23QuGWWSGlRFEBP8AbC.png' },
    { 名称: '战术护臂', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/RrUy0SjinuGJxzwbqKsqH3kCt0sQ48i3.png' },
    { 名称: '主神制式防护服', 类型: '防具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/6rJa9tcxhJfaebKVnbLXgjdDXav6fJat.png' },
    { 名称: '止血喷雾', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/RNsqdhI3eZYK1IFqDpOllscPj5SN1Rzm.png' },
    { 名称: '病毒抑制剂', 类型: '消耗品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/z3ABpaahTZmrYqhk30hUhYrL7YrU7l9p.png' },
    { 名称: '肾上腺素针剂', 类型: '消耗品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/QQToX0ks9IyS9LcPSt0yKUmXxYMKoovj.png' },
    { 名称: '体力恢复药剂', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/LKhmBYFtc39SDfg3m4FnkOAzlJv8QGYz.png' },
    { 名称: '精神稳定剂', 类型: '消耗品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/gp1dEjp3Edj54gVMO0S1m8piuMZ4f76v.png' },
    { 名称: '变异晶核', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/RyRlt8vS3IwJsEtCLmYVVCAX1DCmYIJj.png' },
    { 名称: '异种细胞样本', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/bYuYYXSG1yZUoccRCUDTYkK0EQtzBh66.png' },
    { 名称: '记忆金属片', 类型: '材料', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/SRmjjhOQNfJLY1UC30DQHhU5PikTMfRX.png' },
    { 名称: '主神能量碎片', 类型: '材料', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/CPPqB79KzLM1RD6Q0tXW1dXCV7jf5P7Y.png' },
    { 名称: '黑曜病毒培养皿', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/lqCu6MeXx4oaxEYd79GqEBfKWLBz7LQo.png' },
    { 名称: '基因锁训练手册', 类型: '秘籍', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/Q8Qrh3lQv0am1YvSTsKORtehRKuj2meX.png' },
    { 名称: '近战格斗模块', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/oQDkl0qC0zn0ir0aPyQOg7FeuF4SbuPx.png' },
    { 名称: '精神力扫描教程', 类型: '秘籍', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/zXiSs1T7S1scVnaGU2gnF5goGmsVFhSf.png' },
    { 名称: '轮回者腕表', 类型: '饰品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/AVdhvAUMUuhYqylL1ojHkYqBXEDH8FMX.png' },
    { 名称: '枪械速成模块', 类型: '秘籍', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/xZsLC4IQkS3jDoFURlL5n0k8YU4FT4Re.png' },
    { 名称: '单兵火箭筒', 类型: '武器', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/nIxQOOob2pxxfQ93xKkibr7lXYM8lORl.png' },
    // ─── 无限流常见无前缀物品（gpt-image2）──────────────────────────
    { 名称: '手枪', 类型: '武器', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/qiRTdBvrGTztRmt4JjHZ5Ma1OmJoxn5Z.png' },
    { 名称: '防护背心', 类型: '防具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/iZkSMv6G1kgW43zzQrEwcIZjv0wozOyE.png' },
    { 名称: '护符', 类型: '饰品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/FUnIfxY9swOjOqHlkRQuWgxKruvqfojB.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '迷魂香囊', 类型: '任务道具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/9KrzhPXN6DB3wcIODlU5iKvXPyq74KTT.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '合欢香丸', 类型: '消耗品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/Lpgi0S72OaIucFdBdcB2YklbDUVnhjyj.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '清心解香丸', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/A2UvMVjfkTqF1LwfIgXxjfxF2MVv8dxr.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '醒神银针', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/3V8dcvwzybuCAAPJXqWGqnuYnXK2hNo2.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '摄魂符', 类型: '任务道具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/KNBiOv8gvE9ocYQJfsI6wLx9X4JL2rmF.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '破妄清心符', 类型: '消耗品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/804ielZqjgApcQm7MOxJXj90JE8H1QSd.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '定神玉佩', 类型: '饰品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/1MmGOLOJt7drIzU9lYggiCOvYOEXIK4d.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '魅惑药剂', 类型: '任务道具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/ivRXjSv1CP0K0ZtrXKdi0cRdnGGRC5pW.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '沉眠熏香', 类型: '任务道具', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/ZuZJVi116WknlnE1cdNP7IXyVqX8EnLM.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '反魅惑护符', 类型: '饰品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/zfIAvShQKPXuKr5eBv8NI8MYHvB5CtCI.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '违禁香氛样本', 类型: '任务道具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/5dJ4B6cg1oFcMaKYUTtLbeaVb1BvS0v7.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '催眠录音芯片', 类型: '任务道具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/ZYzlpB3l1q6Ov6AFjI8eJO79KVSua3V0.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '清醒贴片', 类型: '消耗品', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/hgQodBlpYlVYmkvLiEfqpHr4YYs6o1EO.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '香氛检测卡', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/7slwG1AXG3S92WyB2D580fUeFv0twfc3.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '镇静烟雾罐', 类型: '任务道具', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/F88XPzw46GtqCnPwd91xGqJXYDMK2kIb.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '诱导素样本', 类型: '材料', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/FBudasS3zMCedrc48fM0xfK07l3J8ZCx.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '神志清明针', 类型: '消耗品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/cIfJODVFkdIv6xZMm43YPOfbdY4JKSJF.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '魅惑抗性贴片', 类型: '消耗品', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/PPU28Cjj3D9w0QwzxXCbHBsGDO8Y56NF.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '违禁迷情香囊', 类型: '任务道具', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/2fTWq8kxhOaY5GcgBlfL7axWMHtoa923.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '精神锚定护符', 类型: '饰品', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/OQJC5ycYrgIKl6KnbsVmuC5N8252XlTX.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '六欲琉璃炉', 类型: '法宝', 品质: '绝世', 图片URL: 'https://cdn.nodeimage.com/i/LvKc5ozm0rckQO1FjFlPyvibtqMXXncU.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '合欢迷神铃', 类型: '法宝', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/7GZQ241qFTo3fPEArvGm4IJK2otNrygE.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '魅心摄魂镜', 类型: '法宝', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/Ih2U80GpTpGjHEJMDcR9c7IyXzHrXoYf.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '缚念红绫', 类型: '法宝', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/BgXZgImdlleiQks98l1EnFAPWlbttFSF.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '净欲明心镜', 类型: '法宝', 品质: '上品', 图片URL: 'https://cdn.nodeimage.com/i/9ORwUwvO3kENzJtJ88xMwTRcohYbhnyB.png' },
    // ─── 结构化物品库自动生成 ─────────────────────────────────────────
    { 名称: '断欲镇魂印', 类型: '法宝', 品质: '极品', 图片URL: 'https://cdn.nodeimage.com/i/abDr9dqKw9uggR0Y5tmeRL7wCCBni47S.png' },
    // ─── 现代/末日/无限流高频开局物品兜底图 ─────────────────────────────
    { 名称: '随身短刃', 类型: '武器', 品质: '良品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ014cUpBN3JNZFF5cjkxQ3BHMzZJb3NiNnc1Z2RBQUNQUk5yRzl4aElWVzFuNnpfTVhqRk9nRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC16ODRmOTMtbXEyYmRzZHotMS02dTJwd2gucG5nIiwibSI6ImltYWdlL3BuZyIsInMiOjE5NTc3NzUsInQiOjE3ODA3NDgwMTE3MzEsIm1pZCI6Njc3ODh9.f5au4ltF1pBswjlijVRGlnikqcWwCDUFKELjGq-ToD0.png' },
    { 名称: '门禁卡', 类型: '任务道具', 品质: '凡品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ0x4cUpBMDdRUzI4X202ZFFrclFlMnFzR2wwMFNnQUNOUk5yRzl4aElWVXhXOHBMaUpaTXZBRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC0xcjN1eG43LW1xMmI0bDY3LTEtODljd3BnLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoxMjM3MjI4LCJ0IjoxNzgwNzQ3NTc5ODkxLCJtaWQiOjY3NzcyfQ.4sxrEAIlp1EkCl8pFiPXo6Y0YPTvleRThctTJfOXiaQ.png' },
    { 名称: '身份证件', 类型: '任务道具', 品质: '凡品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ01KcUpBMkhCUVF5SEQ3b1ZEdlpUVmpUeUN2dlNBQUNOaE5yRzl4aElWVjA2VXROYUpOanF3RUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC1xamUxa3MtbXEyYjY4ZHUtMS1tYnY5M24ucG5nIiwibSI6ImltYWdlL3BuZyIsInMiOjE4MTk1MTAsInQiOjE3ODA3NDc2NTU0NzcsIm1pZCI6Njc3Nzh9.3hpIfoQymY8BMW0uMJ2NF4cik3LJ3UdQ4mStqbuJEpk.png' },
    { 名称: '充电宝', 类型: '材料', 品质: '良品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ01ocUpBNTNCVzJYUks4QmhPSGhUZl9BY1ZJNjdnQUNPaE5yRzl4aElWVWdqYlYzX0t5YlJ3RUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC0xbTQ4eGd3LW1xMmJiZHRsLTEtZmNxcnQ0LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoxNjEyMjMyLCJ0IjoxNzgwNzQ3ODk1NDM5LCJtaWQiOjY3Nzg0fQ.ruUpBRK0IxlaBmxsDoMXoBkDaWEux8gxgWSQ6t7NmnQ.png' },
    { 名称: '便携药盒', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ05acUpBLS1VNDNfWXBLNXNCZ2F5WTF1Q3RGOTZ3QUNRQk5yRzl4aElWVTAzUXV2eUNiNHd3RUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC0xd2d5ZjhqLW1xMmJpZGxuLTEteDN1Z2JlLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoxNTY4Mzc2LCJ0IjoxNzgwNzQ4MjIyNTIwLCJtaWQiOjY3Nzk4fQ.yqe97faM8gxsxo4PeICuUTUgP7kyJXE-nsfS0z0IwPQ.png' },
    { 名称: '调查相机', 类型: '杂物', 品质: '良品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ05ocUpCQUVoZzdEaUh2YkJCWnZaZG9jeGhJVXVBQUNRUk5yRzl4aElWVm14UlZ4U3hXSkN3RUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC0zMXoyaGgtbXEyYmp3ZzUtMS04ZWVoOWQucG5nIiwibSI6ImltYWdlL3BuZyIsInMiOjE3NTUzNDksInQiOjE3ODA3NDgyOTMxNzQsIm1pZCI6Njc4MDB9.5Dt8600xkP3GnUY9OAe9By0urdD4CLZIaLGN1uZlxmE.png' },
    { 名称: '钥匙串', 类型: '任务道具', 品质: '凡品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ01ScUpBM3h1cC0wNmtSNjhhd2drRHdWQ18tMkR3QUNOeE5yRzl4aElWWGtEQmNJUXRxTnpBRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC0xcXpzaHNoLW1xMmI4ZmY5LTEtcG9qNW1vLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoyMDA4NDIwLCJ0IjoxNzgwNzQ3NzYyMTM0LCJtaWQiOjY3NzgwfQ.MBbXqxiNpN8h38MDGBjT06M3xpzBVKA8-466ALtSxIM.png' },
    { 名称: '出租屋租约', 类型: '任务道具', 品质: '凡品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ01acUpBNVVscGFqbkxDbHozaWJvRXZNQ1VrSVhBQUNPUk5yRzl4aElWVk9OUFNrdHNoUmVnRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC1rcTd6dDAtbXEyYmFvZ3UtMS13aGN2bjcucG5nIiwibSI6ImltYWdlL3BuZyIsInMiOjE0NTEzNjgsInQiOjE3ODA3NDc4NjExOTgsIm1pZCI6Njc3ODJ9.HsAgM5LLmxR-BY96gOg5_6m-tuQgErYe-3E6Pyf2PYk.png' },
    { 名称: '记事本', 类型: '秘籍', 品质: '凡品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ05ScUpBOXRVRlpzOHlSREdiSW54VkFNY0g1YmdnQUNQeE5yRzl4aElWVzgwMXJDNW9EOXN3RUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC0xcWM5eTJzLW1xMmJnb2Z6LTEteXRrczNnLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoyMTkyNDk4LCJ0IjoxNzgwNzQ4MTQyMjQ4LCJtaWQiOjY3Nzk2fQ.swV1J1w3gUM9oR5bz9IZgp6kRBshZoFnjM04jL8T7pA.png' },
    { 名称: '手机充电线', 类型: '材料', 品质: '凡品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ01wcUpBNldyRkFGa2puejFjcWRJb2tCTWdiU2FnQUNQQk5yRzl4aElWWElXX1ZGZEdxZ1JBRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC1kcTd5Y2otbXEyYmMxamktMS1jMGxvNGMucG5nIiwibSI6ImltYWdlL3BuZyIsInMiOjE2Nzk4MzAsInQiOjE3ODA3NDc5MjY3NDAsIm1pZCI6Njc3ODZ9.3PTUz7w3Uokdzt-ePfdFddLQ0hcLRa47QrHHuEaemOY.png' },
    { 名称: '交通卡', 类型: '杂物', 品质: '凡品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ05wcUpCQlcyMDVyZHY4YTRmdjdzTDgwY1ZDOHR3QUNReE5yRzl4aElWVjYyOVB3aVNWLWZBRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC0xbHh3bzhxLW1xMmJsbm9pLTEtOWFhcXl2LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoxODAyMDU1LCJ0IjoxNzgwNzQ4Mzc0Nzk2LCJtaWQiOjY3ODAyfQ.F1fxN7TzCLLuN_7hbqZcItNuR-qL0J9rXOtnVoUqHBI.png' },
    { 名称: '防水雨衣', 类型: '防具', 品质: '凡品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1JwcUpDQmhMU2FyTFppbE9SUnhDV1I5YkRDMmxnQUNWUk5yRzl4aElWVTkzZnVwN0dNaDlRRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC10YTRrZ2EtbXEyZTFudWUtMS1raXcyZ2MucG5nIiwibSI6ImltYWdlL3BuZyIsInMiOjE1OTU1ODAsInQiOjE3ODA3NTI0ODIwMzYsIm1pZCI6Njc4NjZ9.7XVCHZBfWl91HQeb4QohFHKoRn_iV4ZYxeQN6-j8CcE.png' },
    { 名称: '应急药箱', 类型: '消耗品', 品质: '良品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1BacUpCRlQxcDVFVzdvZXBKNUQ1Zk83MnZEcDF3QUNSUk5yRzl4aElWVkN4VWJsZXdZcmlRRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC0xdmE2M3NzLW1xMmJyM3hwLTEtODMycG5yLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoxOTQ1NTQwLCJ0IjoxNzgwNzQ4NjI4NDE3LCJtaWQiOjY3ODMwfQ.ghEPYV4V81BG07sOczxvF9A0yNePbsLglckYkSJ9tXI.png' },
    { 名称: '瓶装水', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1JScUpCNTZ0QmRsbG1ETEZrWWRBNi1ZaDBjT0RBQUNVQk5yRzl4aElWVXNNT19Fc0gxUFRRRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC0xb3B6dW5rLW1xMmRyMmNyLTEtNG13eGpiLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoxNzMwNzc1LCJ0IjoxNzgwNzUxOTk0NzUwLCJtaWQiOjY3ODYwfQ.iEUQTRrYyA3j8SkUKLuMoPqWcWxMi5uoxFr8EFlZ7MM.png' },
    { 名称: '口粮包', 类型: '消耗品', 品质: '凡品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ09CcUpCQ0djZmgtVkF3YlNDS0s4UWVneHF2R0NBQUNSQk5yRzl4aElWVkp6czZ1dFJIZ0lBRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC0xbWI4b3k5LW1xMmJtcGh0LTEta3ZnajdxLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoxODQ0NTIzLCJ0IjoxNzgwNzQ4NDIzMjAwLCJtaWQiOjY3ODA4fQ.VUONdPEpPtbEkQ3cUO6fdhMaikLGGkXz_UFz1esB_MY.png' },
    { 名称: '破窗锤', 类型: '武器', 品质: '凡品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1JocUpCOThoVXBmVTBTa2IwUDYxdHJRTHpIVlpnQUNVeE5yRzl4aElWWGxHZkNqaTQ2UHdnRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC0xb3k3Njl3LW1xMmR3cnlvLTEtcjl0cHpvLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoxOTQ3Mzg2LCJ0IjoxNzgwNzUyMjUzMTQ3LCJtaWQiOjY3ODY0fQ.41rN5T9Vp30s4SZ5VYm5nXG-kQHqnsXRFLE82Hs3chQ.png' },
    { 名称: '对讲机', 类型: '杂物', 品质: '良品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1NacUpDRmEtYk4xdGljQUFXRzhPYlhvclhLNVo4b0FBbHdUYXh2Y1lTRlZHLXQ4Y3g5R2t3VUJBQU1DQUFONUFBTTdCQSIsImUiOiJwbmciLCJuIjoicHJlc2V0LTFtd296ZmMtbXEyZTcxazgtMS12OHZ3M3gucG5nIiwibSI6ImltYWdlL3BuZyIsInMiOjE4NTU3MzEsInQiOjE3ODA3NTI3MzEzMTAsIm1pZCI6Njc4Nzh9.h8NT6OPwGA2PHVW34s5enBnDZgtOHOt4jkAsENcbi6g.png' },
    { 名称: '胶带卷', 类型: '材料', 品质: '凡品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1JacUpCN05GLUduVjIwTnZBQUJYd2JsZTdFZUMxUUFBbEVUYXh2Y1lTRlZHMlY5UHE2eHpQMEJBQU1DQUFONUFBTTdCQSIsImUiOiJwbmciLCJuIjoicHJlc2V0LTFwa2owdDItbXEyZHQybnAtMS1ybGlsYWwucG5nIiwibSI6ImltYWdlL3BuZyIsInMiOjE4MzQzOTIsInQiOjE3ODA3NTIwNzgwNzEsIm1pZCI6Njc4NjJ9.gmexmiJ-vwPPv1Gfo-a-9XFv-nfrfo4WaHzZnBRaVBU.png' },
    { 名称: '消毒喷雾', 类型: '消耗品', 品质: '良品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1J4cUpDQ29FZTd3QmQzVUllNnp5S3NFVUtjeTd3QUNXQk5yRzl4aElWWHh5ODRRWFYwdVhnRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC0xd2Q2anNpLW1xMmUzNzdiLTEtZHU5cmR3LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoxNTkyOTk1LCJ0IjoxNzgwNzUyNTUyNjk2LCJtaWQiOjY3ODY4fQ.B84N1Ot3pk1cH2_4V_DvwQyaJS4CzeLotnlSvd0azPE.png' },
    { 名称: '防割外套', 类型: '防具', 品质: '良品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1NKcUpDRGloWGxxeGx2SkVFbW9FTnNrSjVLbmd3QUNXaE5yRzl4aElWV3A1RG5haTJOaXpnRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC1yZGlneGktbXEyZTRna2gtMS1ic2hkN2IucG5nIiwibSI6ImltYWdlL3BuZyIsInMiOjE4MTMwOTEsInQiOjE3ODA3NTI2MTEwNjMsIm1pZCI6Njc4NzR9.Y2ofTJUpIm9WvvNpTHBJmD8jJhpgQEtukoVEz9S5Gbk.png' },
    { 名称: '一次性手套', 类型: '防具', 品质: '凡品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1NScUpDRUFBVW0wTk1ZdVQ1UjVTUGlQRWFQU2hYd0FBbHNUYXh2Y1lTRlZnUU9QTHZ4VTRtY0JBQU1DQUFONUFBTTdCQSIsImUiOiJwbmciLCJuIjoicHJlc2V0LTEwcXc0dXAtbXEyZTUzd2EtMS1uYTY4d2IucG5nIiwibSI6ImltYWdlL3BuZyIsInMiOjE1NTU2MTEsInQiOjE3ODA3NTI2NDA0NzcsIm1pZCI6Njc4NzZ9.QjwRFJJbNkOkw4NHLGsIcq3tZSRPmoVu42RyI0aazCc.png' },
    { 名称: '柴油桶', 类型: '材料', 品质: '良品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1ZwcUpDejRHd1ItTG50UVVwQzVlX2wwVFUtaUZRQUNlUk5yRzl4aElWV1puN3JINFZwcEpBRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC0xbnJldHg4LW1xMmZ5cmN6LTEtcTZua3Z0LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoxOTc0MDI2LCJ0IjoxNzgwNzU1NzA1NDQ0LCJtaWQiOjY3OTMwfQ.Nvr2tB8g4B2sqo8Q969Upx4bJkFBCpE0jZQ1Aq_Ad2U.png' },
    { 名称: '感染记录本', 类型: '任务道具', 品质: '凡品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1dCcUpDMU1tUkotaUNsUjh0NlBrY3RFeGctU2hBQUNlaE5yRzl4aElWV2ZQM0dtdy1oTWtRRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC0xaTVmbGthLW1xMmcwa2p6LTEtd2p4azZzLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoyMDE0ODcyLCJ0IjoxNzgwNzU1Nzg4NTI1LCJtaWQiOjY3OTM2fQ.gFoNsnNZQ6IM7Rs1hOBY6XTo-dBTDsuoeK3ESYIeQM0.png' },
    { 名称: '打火机', 类型: '杂物', 品质: '凡品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1dKcUpDMS1kalZlR0JXY3VNcVVrTENWODFIZVN3QUNleE5yRzl4aElWV3JfY0wxeDVvYWl3RUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC0xbmNyZ2E1LW1xMmcxbjA1LTEtNmoxM24yLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoyMDg0MDczLCJ0IjoxNzgwNzU1ODM5MDc1LCJtaWQiOjY3OTM4fQ.4nQwDujev8S8l-WLpmkzLa9T1I_FT1fA4eVnil7ve3w.png' },
    { 名称: '任务腕表', 类型: '饰品', 品质: '上品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1dScUpDM0tKRnhfVGJ5cktrQndoTnRTSHdHdkFnQUNmQk5yRzl4aElWVV9Sa2xZRF9wb0lRRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC0xbndqdTh1LW1xMmczOXQ5LTEtam03bmpqLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoxNzI5MzM0LCJ0IjoxNzgwNzU1OTE0NTIzLCJtaWQiOjY3OTQwfQ.I1bgiv0210YZfP9Sop6UUrX2HGMDeISVmwKrmeJTQds.png' },
    { 名称: '奖励点凭证', 类型: '任务道具', 品质: '良品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1dacUpDNGM4NC1peWU0clBQYmctQ0dIb2trdEFnQUNmaE5yRzl4aElWWFU5N1A0c2phYWJ3RUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC1oZ2JpaTEtbXEyZzUwcTAtMS1hMWdlNGoucG5nIiwibSI6ImltYWdlL3BuZyIsInMiOjE4OTMxNzEsInQiOjE3ODA3NTU5OTczMjIsIm1pZCI6Njc5NDJ9.Hk5iTdi0TEHn9f1aZmGaYFEEVH8y-mEEklDVcdSSYxU.png' },
    { 名称: 'D级支线剧情凭证', 类型: '任务道具', 品质: '上品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1d4cUpDNUs3VTFRRUYzTjE4OVNHSHlOQklQa1ZnQUNmeE5yRzl4aElWVVBPT3BLSlZXOTZBRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC15anllZGEtbXEyZzYwdjgtMS00YjVxNXgucG5nIiwibSI6ImltYWdlL3BuZyIsInMiOjE4ODA1MzUsInQiOjE3ODA3NTYwNDI0MTAsIm1pZCI6Njc5NDh9.HZJR1oiM_z9REirOHOZ8tbG53cTOXf0hVby7heRBGd4.png' },
    { 名称: '主神任务卡', 类型: '任务道具', 品质: '良品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1c1cUpDNjNqUUZDUWZucGxMOC1rTjY4YmJaZVpRQUNnQk5yRzl4aElWWHY4VWJuMlJGRmZ3RUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC13Nmt1cXotbXEyZzhkNmktMS04dWIzeWwucG5nIiwibSI6ImltYWdlL3BuZyIsInMiOjE3NDM1NDksInQiOjE3ODA3NTYxNTE4OTgsIm1pZCI6Njc5NTB9.LcGCcSRrf-Z3k1XRqobDqDrxTtVXwzaUUUlHfUj9TxM.png' },
    { 名称: '主神兑换券', 类型: '任务道具', 品质: '良品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1hCcUpDOFlvNjQ5SHB2UW9Wc0FBWkRIUDl2VTZEa0FBb0lUYXh2Y1lTRlZHaHU0MDg0dTZEa0JBQU1DQUFONUFBTTdCQSIsImUiOiJwbmciLCJuIjoicHJlc2V0LXdkMHVoNy1tcTJnYWJ6by0xLTBuaWVzbi5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MjA0NDA1OSwidCI6MTc4MDc1NjI0OTI5NywibWlkIjo2Nzk1Mn0.ti4fahXvidHjyF891JgDsZq41bwYerX7j_E7W2MwgAs.png' },
    { 名称: '剧情地图碎片', 类型: '任务道具', 品质: '凡品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1hScUpDLUZvSDdqZ1BWbFdUX0M3VUtLakVuUDZnQUNoQk5yRzl4aElWVXpoRkdBUGp6OC1nRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC0xeGg2dXRpLW1xMmdjcXduLTEtMzNreGMzLnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoyMTg5OTE2LCJ0IjoxNzgwNzU2MzU4MDc1LCJtaWQiOjY3OTU2fQ.V5AF1MR_WJluaC9PLwnhPnj82FZSMnHJfOnB0gs0Cbc.png' },
    { 名称: '备用弹匣', 类型: '材料', 品质: '良品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1lCcUpDX1haZDBHbXV2bDEtT0JfNTJZTWFBMnZRQUNoUk5yRzl4aElWVjNkSVg2OTRxMm9RRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC1meWdjM3MtbXEyZ2VqcGstMS1jeTc0YmQucG5nIiwibSI6ImltYWdlL3BuZyIsInMiOjE5NzMzODAsInQiOjE3ODA3NTY0NDAyMzAsIm1pZCI6Njc5Njh9.0k2GIEw8nr15wLXkjcPaq9kVLQMhuqmoPsWq0wA2bT8.png' },
    { 名称: '通讯耳麦', 类型: '杂物', 品质: '良品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1lKcUpEQU5iTmVpd3EtcjVHVEhfaUh3bTY3OVJnQUNpQk5yRzl4aElWV0lYZk1wOGJDLVRBRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC0xOGw1MTRwLW1xMmdmcDJwLTEtZm15bXE1LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoxODQ0MTgzLCJ0IjoxNzgwNzU2NDk0MTM5LCJtaWQiOjY3OTcwfQ.CIg4-sUMZeJtFY2CHoqzwniJbh6qxPyFSXGhec9GmSg.png' },
    { 名称: '强光手电', 类型: '杂物', 品质: '良品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1lScUpEQmZOd0FCYTRNOEZpVnc2Y1ZGc2ZnZ0ZfZ0FBb2tUYXh2Y1lTRlZqczR6cFlLOWlhWUJBQU1DQUFONUFBTTdCQSIsImUiOiJwbmciLCJuIjoicHJlc2V0LTFicG02eS1tcTJnaGczYS0xLWxjbGhlcC5wbmciLCJtIjoiaW1hZ2UvcG5nIiwicyI6MTkwNDg0NiwidCI6MTc4MDc1NjU3NTk3MSwibWlkIjo2Nzk3Mn0.EfilyZVu8SvRL4wG1-lTYfJ6MbRFfhVWr4gABGAA5bE.png' },
    { 名称: '便携扫描仪', 类型: '杂物', 品质: '上品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1lwcUpEQ3VJMFJPMEtZZHJXeDhUTDgxNl8tRnJRQUNpeE5yRzl4aElWVk51cEFnTHF6RTZnRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC1oZWNoaWUtbXEyZ2o0azctMS1md2p2ODEucG5nIiwibSI6ImltYWdlL3BuZyIsInMiOjE5Mzc0NDksInQiOjE3ODA3NTY2NTUxMDYsIm1pZCI6Njc5Nzh9.4iG96g1Vockt8-t_yZ9tLRgQF9FzaOpnfb4Ee48sl8o.png' },
    { 名称: '轮回者身份铭牌', 类型: '任务道具', 品质: '良品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1l4cUpERHpadlprYlc3QmY5NkpBc2h5d0R5RlBBQUNqQk5yRzl4aElWVlNjaXFEbk1qZzBRRUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC1kdm40c2wtbXEyZ2ttY3AtMS1zeDluaGcucG5nIiwibSI6ImltYWdlL3BuZyIsInMiOjE4NDQyMDgsInQiOjE3ODA3NTY3MjQxMTIsIm1pZCI6Njc5ODB9._6c1xsiusln70Y0k59O31lptrE68cAop4v6vp1cLoJ4.png' },
    { 名称: '安全屋钥匙', 类型: '任务道具', 品质: '凡品', 图片URL: 'https://image1.bacon159.pp.ua/file/tgs_eyJ2IjoxLCJmIjoiQWdBQ0FnVUFBeUVHQUFUcVR5V1JBQUVCQ1k1cUpERTh1aDhiLTlkTHVRT2pLbTdSbG5GNkpRQUNqUk5yRzl4aElWVnh0V2t1Q0N3eDF3RUFBd0lBQTNrQUF6c0UiLCJlIjoicG5nIiwibiI6InByZXNldC0xYW9vNnBuLW1xMmdtNmIxLTEtejA5ZHQ4LnBuZyIsIm0iOiJpbWFnZS9wbmciLCJzIjoxODQ4NzQ1LCJ0IjoxNzgwNzU2Nzk2NjczLCJtaWQiOjY3OTgyfQ.xqEJBYWRwHLvkjR0Vp3RQLs6Key6-TzaIJHwwBJTMAE.png' },
    // ─── 杂物/通用 ─────────────────────────────────────────────────────
    { 名称: '火折子', 类型: '杂物', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/887DhwnvRPARJkGBaT7pflzTx64oMjeY.png' },
    { 名称: '绳索', 类型: '杂物', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/I34ZQHZWCLERc3mk2iYp3mMwi7WJjVdV.png' },
    { 名称: '地图', 类型: '杂物', 品质: '良品', 图片URL: 'https://cdn.nodeimage.com/i/wCC5tVesF77nJHYJ5CU4Oz7ky3XXao7K.png' },
    { 名称: '银两', 类型: '杂物', 品质: '凡品', 图片URL: 'https://cdn.nodeimage.com/i/EzZInS1ROrjnLxEsDiIipMijOJYktIPe.png' },
];

/**
 * 按物品名称精确匹配预置图片（唯一匹配方式）
 */
export const 精确匹配预置图片 = (itemName: string): 预置物品图片条目 | null => {
    if (!itemName) return null;
    return 预置物品图片列表.find(entry => entry.名称 === itemName) || null;
};

const 规范化预置图名称 = (value: string): string => (
    String(value || '').trim().replace(/[·•・\s_\-—]+/g, '').replace(/青钢/g, '钢')
);

export const 匹配结构化预置图片 = (itemName: string): 预置物品图片条目 | null => {
    if (!itemName) return null;
    const exact = 精确匹配预置图片(itemName);
    if (exact) return exact;
    if (itemName !== itemName.trim()) return null;
    const structured = 查找结构化物品(itemName);
    const normalized = 规范化预置图名称(structured?.名称 || itemName);
    const byStructuredName = 预置物品图片列表.find(entry => 规范化预置图名称(entry.名称) === normalized);
    if (byStructuredName) return byStructuredName;
    if (structured?.物品) {
        const normalizedBase = 规范化预置图名称(structured.物品);
        const byBaseName = 预置物品图片列表.find(entry => 规范化预置图名称(entry.名称) === normalizedBase);
        if (byBaseName) return byBaseName;
    }
    const normalizedInput = 规范化预置图名称(itemName);
    let bestMatch: 预置物品图片条目 | null = null;
    let bestLen = 0;
    for (const entry of 预置物品图片列表) {
        const entryNorm = 规范化预置图名称(entry.名称);
        if (entryNorm.length > 1 && normalizedInput.includes(entryNorm) && entryNorm.length > bestLen) {
            bestMatch = entry;
            bestLen = entryNorm.length;
        }
    }
    return bestMatch;
};

/**
 * 获取物品的预置图片 URL（仅精确名称匹配）
 */
export const 获取预置物品图片URL = (
    itemName: string,
    _itemType?: string,
    _itemQuality?: string
): string | null => {
    const hit = 匹配结构化预置图片(itemName);
    return hit ? hit.图片URL : null;
};
