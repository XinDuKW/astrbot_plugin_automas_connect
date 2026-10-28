const bridge = window.AstrBotPluginPage;

// AUTO-MAS 账号配置字段表（由 repo/app/models/config/script.py 的 pydantic 模型抽取：
// 每个字段带 Field(description=...) 中文名、Literal 枚举、ge/le 范围）。
// 重新生成：python tools/gen_config_schema.py（读 AUTO-MAS 的 repo/app/models/config/script.py）。
const CONFIG_SCHEMA = {"MaaConfig":{"Data":{"kind":"object","ref":"MaaUserConfig.DataFields","fields":{"AnnihilationCompletedWeek":{"kind":"str","label":"剿灭达到周上限时的 ISO 周（形如 \"2026-W34\"）"},"CultivateNotice":{"kind":"str","label":"养成接管提示（注入时写入，供前端展示接管态；空 = 未接管）"},"CustomInfrast":{"kind":"json","label":"自定义基建配置"},"GreenTicketStoreMonth":{"kind":"str","label":"上次完成绿票商店购买的完整时间，按 UTC+4 判断月份；空值表示尚未完成","default":null,"raw":"datetime"},"InfrastPlanIndex":{"kind":"int","label":"无时段排班表下一班的索引：每用户一份、由 MAS 在基建换班完成后推进； 带时段表交 MAA 按时段选班，不读它"},"LastProxyDate":{"kind":"str","label":"上次代理日期","raw":"datetime"},"LastResVersion":{"kind":"str","label":"上次成功代理时服务端的游戏资源版本，用于识别待下载的资源热更新"},"ProxyTimes":{"kind":"int","label":"代理次数"},"StaminaPipelineBackup":{"kind":"json","label":"理智流程升级前完整用户配置 JSON"},"StaminaPipelineVersion":{"kind":"int","label":"理智流程配置迁移版本与升级前完整用户配置（关闭的旧计划仍可找回）"}}},"Info":{"kind":"object","ref":"MaaUserConfig.InfoFields","fields":{"Base":{"kind":"enum","label":"base 来源（shared=共享/independent=独立/native=原生）","options":["shared","independent","native"]},"Id":{"kind":"str","label":"用户 ID"},"IfQuickConfig":{"kind":"bool","label":"是否启用快速配置（与配置来源独立，按用户保存）"},"IfScriptAfterTask":{"kind":"bool","label":"任务后执行脚本"},"IfScriptBeforeTask":{"kind":"bool","label":"任务前执行脚本"},"Name":{"kind":"str","label":"用户名称","raw":"WindowsNameString"},"Notes":{"kind":"str","label":"备注"},"Password":{"kind":"str","label":"密码"},"RemainedDay":{"kind":"int","label":"剩余天数"},"ScriptAfterTask":{"kind":"str","label":"任务后脚本路径","raw":"FilePath"},"ScriptBeforeTask":{"kind":"str","label":"任务前脚本路径","raw":"FilePath"},"Server":{"kind":"enum","label":"游戏服务器","options":["Official","Bilibili","YoStarEN","YoStarJP","YoStarKR","txwy"]},"Status":{"kind":"bool","label":"是否启用"},"Tag":{"kind":"str","label":"用户标签信息（虚拟字段，供前端显示）","raw":"Virtual[str]"}}},"Notify":{"kind":"object","ref":"MaaUserConfig.NotifyFields","fields":{"Enabled":{"kind":"bool","label":"是否启用通知"},"IfSendMail":{"kind":"bool","label":"是否发送邮件"},"IfSendSixStar":{"kind":"bool","label":"是否发送六星通知"},"IfSendStatistic":{"kind":"bool","label":"是否发送统计信息"},"IfServerChan":{"kind":"bool","label":"是否启用 Server 酱"},"ServerChanKey":{"kind":"str","label":"Server 酱密钥"},"ToAddress":{"kind":"str","label":"收件地址"}}},"Stage":{"kind":"object","ref":"MaaUserConfig.StageFields","fields":{"MedicineNumb":{"kind":"int","label":"理智药数量"},"SeriesNumb":{"kind":"enum","label":"连战次数","options":["0","6","5","4","3","2","1","-1"]},"Stage":{"kind":"str","label":"主关卡"},"StageMode":{"kind":"str","label":"关卡模式（Fixed 或关卡计划表 UUID）","raw":"UUID | str"},"Stage_1":{"kind":"str","label":"备选关卡 1"},"Stage_2":{"kind":"str","label":"备选关卡 2"},"Stage_3":{"kind":"str","label":"备选关卡 3"}}},"Task":{"kind":"object","ref":"MaaUserConfig.TaskFields","fields":{"ActivityMedicineNumb":{"kind":"int","label":"活动关优先任务吃理智药数量"},"ActivityStageIndex":{"kind":"int","label":"优先刷取的活动关卡序号"},"Annihilation":{"kind":"enum","label":"剿灭模式","options":["Close","Annihilation","Chernobog@Annihilation","LungmenOutskirts@Annihilation","LungmenDowntown@Annihilation"]},"AnnihilationStartWeekday":{"kind":"enum","label":"剿灭开始星期","options":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]},"CultivateAutoRaise":{"kind":"bool","label":"是否注入 MAA 原生干员培养任务"},"CultivateSkipDuringActivity":{"kind":"bool","label":"活动期间是否跳过养成计划"},"CultivateSkipDuringResourceCollection":{"kind":"bool","label":"资源收集期是否跳过养成计划"},"CultivateSklandAccount":{"kind":"str","label":"森空岛绑定：签到账号组 UUID（凭据引用，凭据本体只存签到域）"},"CultivateSklandUid":{"kind":"str","label":"森空岛绑定：绑定角色的游戏 uid（非森空岛 userId）"},"CultivateTargets":{"kind":"str","label":"干员养成目标","raw":"JsonListString"},"DepotMaintainPlans":{"kind":"str","label":"库存保持计划（快速配置面板维护；MAA 侧同名 PlanList 为透传载体）","raw":"JsonListString"},"EventDepotMaintainPlans":{"kind":"str","label":"活动库存保持计划，保存材料关序号及目标库存，运行时解析当前活动","raw":"JsonListString"},"IfActivityFirst":{"kind":"bool","label":"活动期间是否优先刷活动关"},"IfAward":{"kind":"bool","label":"是否领取奖励"},"IfCultivate":{"kind":"bool","label":"是否干员养成"},"IfDepotMaintain":{"kind":"bool","label":"是否库存保持"},"IfEventDepotMaintain":{"kind":"bool","label":"是否启用活动关均衡理智"},"IfFight":{"kind":"bool","label":"是否理智作战"},"IfGreenTicketStore":{"kind":"bool","label":"是否每月自动购买一次绿票商店"},"IfInfrast":{"kind":"bool","label":"是否基建换班"},"IfMall":{"kind":"bool","label":"是否信用收支"},"IfRecruit":{"kind":"bool","label":"是否公开招募"},"IfStartUp":{"kind":"bool","label":"是否自动唤醒"},"IfSwitchTheme":{"kind":"bool","label":"是否更换主题（主题名称在 MAA 侧配置，MAS 仅透传）"},"InfrastMode":{"kind":"enum","label":"基建模式","options":["Normal","Rotation","Custom"]},"InfrastName":{"kind":"str","label":"基建配置名称","raw":"Virtual[str]"}}}},"MaaEndConfig":{"Data":{"kind":"object","ref":"MaaEndUserConfig.DataFields","fields":{"LastProxyDate":{"kind":"str","label":"上次代理日期","raw":"datetime"},"LastProxyStatus":{"kind":"enum","label":"上次代理状态","options":["未知","成功","失败"]},"PeriodTaskRecords":{"kind":"json","label":"MaaEnd 每日任务完成记录，结构为 daily -> task name -> 日期"},"ProxyTimes":{"kind":"int","label":"代理次数"}}},"Info":{"kind":"object","ref":"MaaEndUserConfig.InfoFields","fields":{"Base":{"kind":"enum","label":"base 来源（shared=共享/independent=独立/native=原生）","options":["shared","independent","native"]},"Id":{"kind":"str","label":"用户ID"},"IfQuickConfig":{"kind":"bool","label":"是否启用快速配置"},"IfScriptAfterTask":{"kind":"bool","label":"任务后执行脚本"},"IfScriptBeforeTask":{"kind":"bool","label":"任务前执行脚本"},"Name":{"kind":"str","label":"用户名称","raw":"WindowsNameString"},"Notes":{"kind":"str","label":"备注"},"Password":{"kind":"str","label":"密码"},"RemainedDay":{"kind":"int","label":"剩余天数"},"Resource":{"kind":"enum","label":"资源名称","options":["官服"]},"SanityMode":{"kind":"str","label":"理智任务配置模式","raw":"UUID | str"},"ScriptAfterTask":{"kind":"str","label":"任务后脚本路径","raw":"FilePath"},"ScriptBeforeTask":{"kind":"str","label":"任务前脚本路径","raw":"FilePath"},"Status":{"kind":"bool","label":"是否启用"},"Tag":{"kind":"str","label":"用户标签信息","raw":"Virtual[str]"}}},"Notify":{"kind":"object","ref":"MaaEndUserConfig.NotifyFields","fields":{"Enabled":{"kind":"bool","label":"是否启用通知"},"IfSendMail":{"kind":"bool","label":"是否发送邮件"},"IfSendStatistic":{"kind":"bool","label":"是否发送统计信息"},"IfServerChan":{"kind":"bool","label":"是否启用 Server 酱"},"PushLogMode":{"kind":"enum","label":"任务报告节点详情的推送模式（log_box 采集的关键节点）： 关闭 = 不采集；逐条 = 采集并逐条带回时间戳；汇总 = 采集并按状态聚合","options":["关闭","逐条","汇总"]},"ServerChanKey":{"kind":"str","label":"Server 酱密钥"},"ToAddress":{"kind":"str","label":"收件地址"}}},"Task":{"kind":"object","ref":"MaaEndUserConfig.TaskFields","fields":{"AutoCollectCommonRoutes":{"kind":"str","label":"自动采集通用资源路线","raw":"Any"},"AutoCollectMode":{"kind":"enum","label":"自动采集路线安排：分散或集中","options":["Distributed","Concentrated"]},"AutoCollectRoutes":{"kind":"str","label":"自动采集区域资源路线","raw":"Any"},"AutoEssenceMenu":{"kind":"enum","label":"基质刷取模式","options":["Random","Location","Target"]},"AutoEssenceSpecifiedLocation":{"kind":"str","label":"基质刷取指定地点"},"AutoEssenceTargetWeapons":{"kind":"list","label":"基质目标武器 ID 列表","itemKind":"str"},"CrisisDrills":{"kind":"enum","label":"危境预演任务","options":["AdvancedProgression1","AdvancedProgression2","AdvancedProgression3","AdvancedProgression4","AdvancedProgression5"]},"DailyOnceTasks":{"kind":"str","label":"每日正常完成一次后当天跳过的 MaaEnd 任务名列表（JSON 字符串）","raw":"JsonListString"},"IfAutoCollect":{"kind":"bool","label":"自动采集"},"IfAutoEcoFarm":{"kind":"bool","label":"生态农场"},"IfAutoSell":{"kind":"bool","label":"售卖弹性物资"},"IfAutoStockStaple":{"kind":"bool","label":"购买稳定物资"},"IfAutoStockpile":{"kind":"bool","label":"自动囤货"},"IfAutoUseSpMedication":{"kind":"bool","label":"应急理智加强剂"},"IfCreditShoppingN2":{"kind":"bool","label":"信用点购物"},"IfDailyRewards":{"kind":"bool","label":"日常奖励领取"},"IfDeliveryJobs":{"kind":"bool","label":"转交委托"},"IfDijiangRewards":{"kind":"bool","label":"基建任务"},"IfEnvironmentMonitoring":{"kind":"bool","label":"环境监测"},"IfPullCountCalculator":{"kind":"bool","label":"抽数计算"},"IfResourceRecycleStation":{"kind":"bool","label":"资源回收站"},"IfSanity":{"kind":"bool","label":"理智任务"},"IfSeizeDeliveryJobs":{"kind":"bool","label":"抢委托送货"},"IfSellProduct":{"kind":"bool","label":"售卖产品"},"IfTrialOfSwordmancy":{"kind":"bool","label":"选剑演武"},"IfVisitFriends":{"kind":"bool","label":"拜访好友"},"OperatorProgression":{"kind":"enum","label":"干员养成任务","options":["OperatorEXP","Promotions","T-Creds","SkillUp"]},"RewardsSetOption":{"kind":"enum","label":"奖励组选项","options":["RewardsSetA","RewardsSetB"]},"SanityTaskType":{"kind":"enum","label":"理智任务类型","options":["OperatorProgression","WeaponProgression","CrisisDrills","Essence"]},"SeizeDeliveryJobsCommissionSource":{"kind":"enum","label":"抢委托送货委托接收点","options":["Unlimited","WulingCity","TestArea"]},"SeizeDeliveryJobsReward":{"kind":"float","label":"抢委托送货最低接取价格（万）"},"WeaponProgression":{"kind":"enum","label":"武器养成任务","options":["WeaponEXP","WeaponTune"]}}}},"SrcConfig":{"Data":{"kind":"object","ref":"SrcUserConfig.DataFields","fields":{"LastProxyDate":{"kind":"str","label":"上次代理日期","raw":"datetime"},"ProxyTimes":{"kind":"int","label":"代理次数"}}},"Info":{"kind":"object","ref":"SrcUserConfig.InfoFields","fields":{"Base":{"kind":"enum","label":"base 来源（shared=共享/independent=独立/native=原生）","options":["shared","independent","native"]},"Id":{"kind":"str","label":"用户 ID"},"IfQuickConfig":{"kind":"bool","label":"是否启用快速配置（与配置来源独立，按用户保存）"},"IfScriptAfterTask":{"kind":"bool","label":"任务后执行脚本"},"IfScriptBeforeTask":{"kind":"bool","label":"任务前执行脚本"},"Name":{"kind":"str","label":"用户名称","raw":"WindowsNameString"},"Notes":{"kind":"str","label":"备注"},"Password":{"kind":"str","label":"密码"},"RemainedDay":{"kind":"int","label":"剩余天数"},"ScriptAfterTask":{"kind":"str","label":"任务后脚本路径","raw":"FilePath"},"ScriptBeforeTask":{"kind":"str","label":"任务前脚本路径","raw":"FilePath"},"Server":{"kind":"enum","label":"游戏服务器","options":["CN-Official","CN-Bilibili","VN-Official","OVERSEA-America","OVERSEA-Asia","OVERSEA-Europe","OVERSEA-TWHKMO"]},"Status":{"kind":"bool","label":"是否启用"},"Tag":{"kind":"str","label":"用户标签信息","raw":"Virtual[str]"}}},"Notify":{"kind":"object","ref":"SrcUserConfig.NotifyFields","fields":{"Enabled":{"kind":"bool","label":"是否启用通知"},"IfSendMail":{"kind":"bool","label":"是否发送邮件"},"IfSendStatistic":{"kind":"bool","label":"是否发送统计信息"},"IfServerChan":{"kind":"bool","label":"是否启用 Server 酱"},"ServerChanKey":{"kind":"str","label":"Server 酱密钥"},"ToAddress":{"kind":"str","label":"收件地址"}}},"Stage":{"kind":"object","ref":"SrcUserConfig.StageFields","fields":{"Channel":{"kind":"enum","label":"关卡通道","options":["Relic","Materials","Ornament"]},"EchoOfWar":{"kind":"enum","label":"历战余响关卡","options":["-","Echo_of_War_The_Comedy_of_Doom","Echo_of_War_Rusted_Crypt_of_the_Iron_Carcass","Echo_of_War_Glance_of_Twilight","Echo_of_War_Inner_Beast_Battlefield","Echo_of_War_Salutations_of_Ashen_Dreams","Echo_of_War_Borehole_Planet_Past_Nightmares","Echo_of_War_Divine_Seed","Echo_of_War_End_of_the_Eternal_Freeze","Echo_of_War_Destruction_Beginning"]},"ExtractReservedTrailblazePower":{"kind":"bool","label":"使用储备开拓力"},"FuelReserve":{"kind":"int","label":"保留的燃料数量"},"Materials":{"kind":"enum","label":"材料关卡","options":["-","Calyx_Golden_Memories_Planarcadia","Calyx_Golden_Memories_Amphoreus","Calyx_Golden_Memories_Penacony","Calyx_Golden_Memories_The_Xianzhou_Luofu","Calyx_Golden_Memories_Jarilo_VI","Calyx_Golden_Aether_Planarcadia","Calyx_Golden_Aether_Amphoreus","Calyx_Golden_Aether_Penacony","Calyx_Golden_Aether_The_Xianzhou_Luofu","Calyx_Golden_Aether_Jarilo_VI","Calyx_Golden_Treasures_Planarcadia","Calyx_Golden_Treasures_Amphoreus","Calyx_Golden_Treasures_Penacony","Calyx_Golden_Treasures_The_Xianzhou_Luofu","Calyx_Golden_Treasures_Jarilo_VI","Calyx_Crimson_Destruction_Herta_StorageZone","Calyx_Crimson_Destruction_Luofu_ScalegorgeWaterscape","Calyx_Crimson_Destruction_Planarcadia_InkfordHermitage","Calyx_Crimson_Preservation_Herta_SupplyZone","Calyx_Crimson_Preservation_Penacony_ClockStudiosThemePark","Calyx_Crimson_The_Hunt_Jarilo_OutlyingSnowPlains","Calyx_Crimson_The_Hunt_Penacony_SoulGladScorchsandAuditionVenue","Calyx_Crimson_The_Hunt_Amphoreus_MemortisShoreRuinsofTime","Calyx_Crimson_Abundance_Jarilo_BackwaterPass","Calyx_Crimson_Abundance_Luofu_FyxestrollGarden","Calyx_Crimson_Erudition_Jarilo_RivetTown","Calyx_Crimson_Erudition_Penacony_PenaconyGrandTheater","Calyx_Crimson_Erudition_Planarcadia_SeafeldTVTower","Calyx_Crimson_Harmony_Jarilo_RobotSettlement","Calyx_Crimson_Harmony_Penacony_TheReverieDreamscape","Calyx_Crimson_Nihility_Jarilo_GreatMine","Calyx_Crimson_Nihility_Luofu_AlchemyCommission","Calyx_Crimson_Nihility_Amphoreus_RadiantScarwoodGroveofEpiphany","Calyx_Crimson_Remembrance_Amphoreus_StrifeRuinsCastrumKremnos","Calyx_Crimson_Elation_Planarcadia_WorldEndTavern","Stagnant_Shadow_Spike","Stagnant_Shadow_Perdition","Stagnant_Shadow_Duty","Stagnant_Shadow_Deepsheaf","Stagnant_Shadow_Blaze","Stagnant_Shadow_Scorch","Stagnant_Shadow_Roast","Stagnant_Shadow_Ire","Stagnant_Shadow_Ashes","Stagnant_Shadow_Rime","Stagnant_Shadow_Icicle","Stagnant_Shadow_Nectar","Stagnant_Shadow_Sirens","Stagnant_Shadow_Fulmination","Stagnant_Shadow_Doom","Stagnant_Shadow_Mechwolf","Stagnant_Shadow_Soundburst","Stagnant_Shadow_Gust","Stagnant_Shadow_Celestial","Stagnant_Shadow_Gloam","Stagnant_Shadow_Cinders","Stagnant_Shadow_Quanta","Stagnant_Shadow_Abomination","Stagnant_Shadow_Gelidmoon","Stagnant_Shadow_Devour","Stagnant_Shadow_Mirage","Stagnant_Shadow_Puppetry","Stagnant_Shadow_Timbre","Stagnant_Shadow_Sloggyre"]},"Ornament":{"kind":"enum","label":"饰品关卡","options":["-","Divergent_Universe_Bugs_Incoming","Divergent_Universe_Gilded_Recollection","Divergent_Universe_Within_the_West_Wind","Divergent_Universe_Moonlit_Blood","Divergent_Universe_Unceasing_Strife","Divergent_Universe_Famished_Worker","Divergent_Universe_Eternal_Comedy","Divergent_Universe_To_Sweet_Dreams","Divergent_Universe_Pouring_Blades","Divergent_Universe_Fruit_of_Evil","Divergent_Universe_Permafrost","Divergent_Universe_Gentle_Words","Divergent_Universe_Smelted_Heart","Divergent_Universe_Untoppled_Walls"]},"Relic":{"kind":"enum","label":"遗器关卡","options":["-","Cavern_of_Corrosion_Path_of_Insight","Cavern_of_Corrosion_Path_of_Possession","Cavern_of_Corrosion_Path_of_Hidden_Salvation","Cavern_of_Corrosion_Path_of_Thundersurge","Cavern_of_Corrosion_Path_of_Aria","Cavern_of_Corrosion_Path_of_Uncertainty","Cavern_of_Corrosion_Path_of_Cavalier","Cavern_of_Corrosion_Path_of_Dreamdive","Cavern_of_Corrosion_Path_of_Darkness","Cavern_of_Corrosion_Path_of_Elixir_Seekers","Cavern_of_Corrosion_Path_of_Conflagration","Cavern_of_Corrosion_Path_of_Holy_Hymn","Cavern_of_Corrosion_Path_of_Providence","Cavern_of_Corrosion_Path_of_Drifting","Cavern_of_Corrosion_Path_of_Jabbing_Punch","Cavern_of_Corrosion_Path_of_Gelid_Wind"]},"SimulatedUniverseWorld":{"kind":"enum","label":"模拟宇宙关卡","options":["-","Simulated_Universe_World_3","Simulated_Universe_World_4","Simulated_Universe_World_5","Simulated_Universe_World_6","Simulated_Universe_World_8"]},"UseFuel":{"kind":"bool","label":"使用燃料"}}}},"HSRConfig":{"Control":{"kind":"object","ref":"HSRUserConfig.ControlFields","fields":{"M7A":{"kind":"bool","label":"原生来源时是否运行三月七"},"SRA":{"kind":"bool","label":"原生来源（native）时运行哪几个引擎；都没勾时回落到已配置路径的引擎"}}},"Data":{"kind":"object","ref":"HSRUserConfig.DataFields","fields":{"EchoOfWarCompletedThisWeek":{"kind":"bool","label":"本周是否已完成历战余响"},"EchoOfWarLastCompletionDate":{"kind":"str","label":"历战余响最近一次完成日期","raw":"datetime"},"EchoOfWarLastResetWeek":{"kind":"str","label":"历战余响上次重置 ISO 周（形如 \"2025-W23\"）"},"LastProxyDate":{"kind":"str","label":"上次代理日期","raw":"datetime"},"M7ARedeemCodeFingerprint":{"kind":"str","label":"M7A 兑换码指纹"},"ProxyTimes":{"kind":"int","label":"代理次数"},"SRARedeemCodeFingerprint":{"kind":"str","label":"兑换码状态指纹（仅状态信息，不保存兑换码明文）"},"WeeklyCompletedThisWeek":{"kind":"bool","label":"本周是否已完成周常（仅依据 Data 字段判断）"},"WeeklyLastCompletionDate":{"kind":"str","label":"周常（差分宇宙/货币战争）最近一次完成日期","raw":"datetime"},"WeeklyLastResetWeek":{"kind":"str","label":"周常上次重置 ISO 周（形如 \"2025-W23\"）"}}},"Info":{"kind":"object","ref":"HSRUserConfig.InfoFields","fields":{"Base":{"kind":"enum","label":"base 来源（shared/independent/native）：shared = 共用脚本级计划； independent = 本用户自己的计划；native = 原样运行 SRA / 三月七 当前的原生配置","options":["shared","independent","native"]},"Id":{"kind":"str","label":"用户 ID（账号）"},"IfQuickConfig":{"kind":"bool","label":"是否启用快速配置（与配置来源独立，按用户保存）"},"IfScriptAfterTask":{"kind":"bool","label":"任务后执行脚本"},"IfScriptBeforeTask":{"kind":"bool","label":"任务前执行脚本"},"Name":{"kind":"str","label":"用户名称","raw":"WindowsNameString"},"Notes":{"kind":"str","label":"备注"},"Password":{"kind":"str","label":"密码"},"RemainedDay":{"kind":"int","label":"剩余天数"},"ScriptAfterTask":{"kind":"str","label":"任务后脚本路径","raw":"FilePath"},"ScriptBeforeTask":{"kind":"str","label":"任务前脚本路径","raw":"FilePath"},"Server":{"kind":"enum","label":"游戏服务器","options":["CN-Official"]},"Status":{"kind":"bool","label":"是否启用"},"Tag":{"kind":"str","label":"用户标签信息（虚拟字段，供前端显示）","raw":"Virtual[str]"}}},"Managed":{"kind":"object","ref":"HSRUserConfig.ManagedFields","fields":{"Options":{"kind":"json","label":"托管任务选项 JSON"},"TaskMapping":{"kind":"json","label":"托管任务映射 JSON"}}},"Notify":{"kind":"object","ref":"HSRUserConfig.NotifyFields","fields":{"Enabled":{"kind":"bool","label":"是否启用通知"},"IfSendMail":{"kind":"bool","label":"是否发送邮件"},"IfSendStatistic":{"kind":"bool","label":"是否发送统计信息"},"IfServerChan":{"kind":"bool","label":"是否启用 Server 酱"},"ServerChanKey":{"kind":"str","label":"Server 酱密钥"},"ToAddress":{"kind":"str","label":"收件地址"}}},"Stage":{"kind":"object","ref":"HSRUserConfig.StageFields","fields":{"Channel":{"kind":"enum","label":"体力关卡通道","options":["CalyxGolden","CalyxCrimson","Relic","Ornament"]},"ScriptEchoOfWar":{"kind":"json","label":"历战余响脚本原生字段 JSON"},"ScriptStage":{"kind":"json","label":"主刷关卡脚本原生字段 JSON"}}},"TaskOpt":{"kind":"object","ref":"HSRUserConfig.TaskOptFields","fields":{"EchoOfWarWeekday":{"kind":"enum","label":"历战余响开始刷的星期（周一 ~ 周日）","options":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]}}},"TaskSwitch":{"kind":"object","ref":"HSRUserConfig.TaskSwitchFields","fields":{"CurrencyWars":{"kind":"bool","label":"货币战争模块开关"},"Daily":{"kind":"bool","label":"日常模块开关"},"DivergentUniverse":{"kind":"bool","label":"差分宇宙模块开关"},"ReceiveRewards":{"kind":"bool","label":"领取奖励模块开关"}}}},"MaaFWConfig":{"Data":{"kind":"object","ref":"MaaFWUserConfig.DataFields","fields":{"IfPassCheck":{"kind":"bool","label":"是否通过检查"},"LastProxyDate":{"kind":"str","label":"上次代理日期","raw":"datetime"},"LastProxyStatus":{"kind":"str","label":"上次运行状态"},"PeriodTaskRecords":{"kind":"json","label":"MaaFW 周期任务完成记录，结构为 weekly/monthly -> task name -> period key"},"ProxyTimes":{"kind":"int","label":"代理次数"}}},"Device":{"kind":"object","ref":"MaaFWUserConfig.DeviceFields","fields":{"AdbAddress":{"kind":"str","label":"当前用户覆盖 ADB 地址，留空时使用脚本级模拟器配置"},"HWnd":{"kind":"int","label":"Win32 / Gamepad 窗口句柄，0 表示未指定"},"PlayCoverAddress":{"kind":"str","label":"PlayCover 地址"},"PlayCoverUuid":{"kind":"str","label":"PlayCover UUID"}}},"Info":{"kind":"object","ref":"MaaFWUserConfig.InfoFields","fields":{"Account":{"kind":"str","label":"账号信息，仅用于 AUTO-MAS 记录，不自动传入 MaaFW 任务"},"Base":{"kind":"enum","label":"base 来源（shared=共享/independent=独立/native=原生）","options":["shared","independent","native"]},"Controller":{"kind":"str","label":"MaaFW controller 名称，留空时按 interface 和设备配置自动选择"},"IfQuickConfig":{"kind":"bool","label":"是否启用快速配置（与配置来源独立，按用户保存）"},"IfScriptAfterTask":{"kind":"bool","label":"是否在任务后执行脚本"},"IfScriptBeforeTask":{"kind":"bool","label":"是否在任务前执行脚本"},"Name":{"kind":"str","label":"用户名称","raw":"WindowsNameString"},"Notes":{"kind":"str","label":"备注"},"Password":{"kind":"str","label":"密码信息，仅用于 AUTO-MAS 记录，不自动传入 MaaFW 任务"},"RemainedDay":{"kind":"int","label":"剩余天数"},"Resource":{"kind":"str","label":"MaaFW resource 名称，留空时选择匹配 controller 的第一个 resource"},"ScriptAfterTask":{"kind":"str","label":"任务后脚本路径","raw":"FilePath"},"ScriptBeforeTask":{"kind":"str","label":"任务前脚本路径","raw":"FilePath"},"Status":{"kind":"bool","label":"是否启用"},"Tag":{"kind":"str","label":"用户标签信息","raw":"Virtual[str]"}}},"Notify":{"kind":"object","ref":"MaaFWUserConfig.NotifyFields","fields":{"Enabled":{"kind":"bool","label":"是否启用通知"},"IfSendMail":{"kind":"bool","label":"是否发送邮件"},"IfSendStatistic":{"kind":"bool","label":"是否发送统计信息"},"IfServerChan":{"kind":"bool","label":"是否启用 Server 酱"},"ServerChanKey":{"kind":"str","label":"Server 酱密钥"},"ToAddress":{"kind":"str","label":"收件地址"}}},"Task":{"kind":"object","ref":"MaaFWUserConfig.TaskFields","fields":{"SelectedPreset":{"kind":"str","label":"当前选中的 interface preset 名称，留空时使用 interface 默认逻辑"},"TaskSnapshot":{"kind":"json","label":"当前用户的任务快照，结构为 taskOrder/taskChecked/taskOptions/globalOptions， 可选 taskLabels（用户给某一份实例起的显示名，只影响界面显示）； 除 globalOptions 外各键都是任务实例 id，同一个任务可以重复入队（见 MaaFWTaskSnapshot）； globalOptions 是全局选项的值，每个用户一份、所有任务共用。 默认的空快照在建用户、读用户与运行前按项目默认（预设或默认勾选）补成实打实的队列， 见 app/task/MaaFW/tools/embedded/default_snapshot.py"}}}},"M9AConfig":{"Data":{"kind":"object","ref":"MaaFWUserConfig.DataFields","fields":{"IfPassCheck":{"kind":"bool","label":"是否通过检查"},"LastProxyDate":{"kind":"str","label":"上次代理日期","raw":"datetime"},"LastProxyStatus":{"kind":"str","label":"上次运行状态"},"PeriodTaskRecords":{"kind":"json","label":"MaaFW 周期任务完成记录，结构为 weekly/monthly -> task name -> period key"},"ProxyTimes":{"kind":"int","label":"代理次数"}}},"Device":{"kind":"object","ref":"MaaFWUserConfig.DeviceFields","fields":{"AdbAddress":{"kind":"str","label":"当前用户覆盖 ADB 地址，留空时使用脚本级模拟器配置"},"HWnd":{"kind":"int","label":"Win32 / Gamepad 窗口句柄，0 表示未指定"},"PlayCoverAddress":{"kind":"str","label":"PlayCover 地址"},"PlayCoverUuid":{"kind":"str","label":"PlayCover UUID"}}},"Info":{"kind":"object","ref":"MaaFWUserConfig.InfoFields","fields":{"Account":{"kind":"str","label":"账号信息，仅用于 AUTO-MAS 记录，不自动传入 MaaFW 任务"},"Base":{"kind":"enum","label":"base 来源（shared=共享/independent=独立/native=原生）","options":["shared","independent","native"]},"Controller":{"kind":"str","label":"MaaFW controller 名称，留空时按 interface 和设备配置自动选择"},"IfQuickConfig":{"kind":"bool","label":"是否启用快速配置（与配置来源独立，按用户保存）"},"IfScriptAfterTask":{"kind":"bool","label":"是否在任务后执行脚本"},"IfScriptBeforeTask":{"kind":"bool","label":"是否在任务前执行脚本"},"Name":{"kind":"str","label":"用户名称","raw":"WindowsNameString"},"Notes":{"kind":"str","label":"备注"},"Password":{"kind":"str","label":"密码信息，仅用于 AUTO-MAS 记录，不自动传入 MaaFW 任务"},"RemainedDay":{"kind":"int","label":"剩余天数"},"Resource":{"kind":"str","label":"MaaFW resource 名称，留空时选择匹配 controller 的第一个 resource"},"ScriptAfterTask":{"kind":"str","label":"任务后脚本路径","raw":"FilePath"},"ScriptBeforeTask":{"kind":"str","label":"任务前脚本路径","raw":"FilePath"},"Status":{"kind":"bool","label":"是否启用"},"Tag":{"kind":"str","label":"用户标签信息","raw":"Virtual[str]"}}},"Notify":{"kind":"object","ref":"MaaFWUserConfig.NotifyFields","fields":{"Enabled":{"kind":"bool","label":"是否启用通知"},"IfSendMail":{"kind":"bool","label":"是否发送邮件"},"IfSendStatistic":{"kind":"bool","label":"是否发送统计信息"},"IfServerChan":{"kind":"bool","label":"是否启用 Server 酱"},"ServerChanKey":{"kind":"str","label":"Server 酱密钥"},"ToAddress":{"kind":"str","label":"收件地址"}}},"Task":{"kind":"object","ref":"MaaFWUserConfig.TaskFields","fields":{"SelectedPreset":{"kind":"str","label":"当前选中的 interface preset 名称，留空时使用 interface 默认逻辑"},"TaskSnapshot":{"kind":"json","label":"当前用户的任务快照，结构为 taskOrder/taskChecked/taskOptions/globalOptions， 可选 taskLabels（用户给某一份实例起的显示名，只影响界面显示）； 除 globalOptions 外各键都是任务实例 id，同一个任务可以重复入队（见 MaaFWTaskSnapshot）； globalOptions 是全局选项的值，每个用户一份、所有任务共用。 默认的空快照在建用户、读用户与运行前按项目默认（预设或默认勾选）补成实打实的队列， 见 app/task/MaaFW/tools/embedded/default_snapshot.py"}}}},"MSSConfig":{"Data":{"kind":"object","ref":"MSSUserConfig.DataFields","fields":{"IfPassCheck":{"kind":"bool","label":"是否通过检查"},"LastProxyDate":{"kind":"str","label":"上次代理日期","raw":"datetime"},"LastProxyStatus":{"kind":"str","label":"上次运行状态"},"PeriodTaskRecords":{"kind":"json","label":"MaaFW 周期任务完成记录，结构为 weekly/monthly -> task name -> period key"},"ProxyTimes":{"kind":"int","label":"代理次数"},"PersonalMssDefense":{"kind":"json","label":"个人版「灾变防线」的编排记录，形如 {\"armed\": 期, \"done\": 期}。 armed 是上次把它编进队列的那一期，done 是已经确认打完的那一期： 用「上次运行是否成功」把 armed 升成 done，所以跑失败的那期下次还会重试。 期取活动公告的开始时刻（见 app/tools/stella_official.py），跨月也认得出是同一期。"}}},"Device":{"kind":"object","ref":"MaaFWUserConfig.DeviceFields","fields":{"AdbAddress":{"kind":"str","label":"当前用户覆盖 ADB 地址，留空时使用脚本级模拟器配置"},"HWnd":{"kind":"int","label":"Win32 / Gamepad 窗口句柄，0 表示未指定"},"PlayCoverAddress":{"kind":"str","label":"PlayCover 地址"},"PlayCoverUuid":{"kind":"str","label":"PlayCover UUID"}}},"Info":{"kind":"object","ref":"MSSUserConfig.InfoFields","fields":{"Account":{"kind":"str","label":"账号信息，仅用于 AUTO-MAS 记录，不自动传入 MaaFW 任务"},"Base":{"kind":"enum","label":"base 来源（shared=共享/independent=独立/native=原生）","options":["shared","independent","native"]},"Controller":{"kind":"str","label":"MaaFW controller 名称，留空时按 interface 和设备配置自动选择"},"IfQuickConfig":{"kind":"bool","label":"是否启用快速配置（与配置来源独立，按用户保存）"},"IfScriptAfterTask":{"kind":"bool","label":"是否在任务后执行脚本"},"IfScriptBeforeTask":{"kind":"bool","label":"是否在任务前执行脚本"},"Name":{"kind":"str","label":"用户名称","raw":"WindowsNameString"},"Notes":{"kind":"str","label":"备注"},"Password":{"kind":"str","label":"密码信息，仅用于 AUTO-MAS 记录，不自动传入 MaaFW 任务"},"RemainedDay":{"kind":"int","label":"剩余天数"},"Resource":{"kind":"str","label":"MaaFW resource 名称，留空时选择匹配 controller 的第一个 resource"},"ScriptAfterTask":{"kind":"str","label":"任务后脚本路径","raw":"FilePath"},"ScriptBeforeTask":{"kind":"str","label":"任务前脚本路径","raw":"FilePath"},"Status":{"kind":"bool","label":"是否启用"},"Tag":{"kind":"str","label":"用户标签信息","raw":"Virtual[str]"},"IfActivityFirst":{"kind":"bool","label":"活动优先：队列里没加「活动快速战斗」时，确认在活动期也自动加入，排在悬赏试炼之前"},"PlanMode":{"kind":"str","label":"悬赏试炼关卡来源：Fixed 用任务队列里配的，选了计划表就按当天槽位改","raw":"UUID | str"}}},"Notify":{"kind":"object","ref":"MaaFWUserConfig.NotifyFields","fields":{"Enabled":{"kind":"bool","label":"是否启用通知"},"IfSendMail":{"kind":"bool","label":"是否发送邮件"},"IfSendStatistic":{"kind":"bool","label":"是否发送统计信息"},"IfServerChan":{"kind":"bool","label":"是否启用 Server 酱"},"ServerChanKey":{"kind":"str","label":"Server 酱密钥"},"ToAddress":{"kind":"str","label":"收件地址"}}},"Task":{"kind":"object","ref":"MaaFWUserConfig.TaskFields","fields":{"SelectedPreset":{"kind":"str","label":"当前选中的 interface preset 名称，留空时使用 interface 默认逻辑"},"TaskSnapshot":{"kind":"json","label":"当前用户的任务快照，结构为 taskOrder/taskChecked/taskOptions/globalOptions， 可选 taskLabels（用户给某一份实例起的显示名，只影响界面显示）； 除 globalOptions 外各键都是任务实例 id，同一个任务可以重复入队（见 MaaFWTaskSnapshot）； globalOptions 是全局选项的值，每个用户一份、所有任务共用。 默认的空快照在建用户、读用户与运行前按项目默认（预设或默认勾选）补成实打实的队列， 见 app/task/MaaFW/tools/embedded/default_snapshot.py"}}}},"GeneralConfig":{"Data":{"kind":"object","ref":"GeneralUserConfig.DataFields","fields":{"LastProxyDate":{"kind":"str","label":"上次代理日期","raw":"datetime"},"ProxyTimes":{"kind":"int","label":"代理次数"}}},"Info":{"kind":"object","ref":"GeneralUserConfig.InfoFields","fields":{"Base":{"kind":"enum","label":"base 来源（shared=共享/independent=独立/native=原生）","options":["shared","independent","native"]},"IfScriptAfterTask":{"kind":"bool","label":"是否在任务后执行脚本"},"IfScriptBeforeTask":{"kind":"bool","label":"是否在任务前执行脚本"},"IfUseMasConfig":{"kind":"bool","label":"兼容旧版用户独立脚本配置"},"Name":{"kind":"str","label":"用户名称","raw":"WindowsNameString"},"Notes":{"kind":"str","label":"备注"},"RemainedDay":{"kind":"int","label":"剩余天数"},"ScriptAfterTask":{"kind":"str","label":"任务后脚本路径","raw":"FilePath"},"ScriptBeforeTask":{"kind":"str","label":"任务前脚本路径","raw":"FilePath"},"Status":{"kind":"bool","label":"是否启用"},"Tag":{"kind":"str","label":"用户标签信息","raw":"Virtual[str]"}}},"Notify":{"kind":"object","ref":"GeneralUserConfig.NotifyFields","fields":{"Enabled":{"kind":"bool","label":"是否启用通知"},"IfSendMail":{"kind":"bool","label":"是否发送邮件"},"IfSendStatistic":{"kind":"bool","label":"是否发送统计信息"},"IfServerChan":{"kind":"bool","label":"是否启用 Server 酱"},"ServerChanKey":{"kind":"str","label":"Server 酱密钥"},"ToAddress":{"kind":"str","label":"收件地址"}}}},"OkwwConfig":{"Data":{"kind":"object","ref":"OkwwUserConfig.DataFields","fields":{"LastProxyDate":{"kind":"str","label":"上次代理日期","raw":"datetime"},"LastProxyStatus":{"kind":"enum","label":"上次代理状态（未知/成功/失败）","options":["未知","成功","失败","维护中"]},"LastTaskIndex":{"kind":"int","label":"上次运行的 ok-ww 任务序号（-t N）"},"ProxyTimes":{"kind":"int","label":"代理次数"}}},"Info":{"kind":"object","ref":"OkwwUserConfig.InfoFields","fields":{"Base":{"kind":"enum","label":"base 来源（shared=共享、independent=独立、native=脚本原生配置）","options":["shared","independent","native"]},"Id":{"kind":"str","label":"账号"},"IfQuickConfig":{"kind":"bool","label":"是否启用 MAS 快速配置覆盖高频任务字段"},"IfScriptAfterTask":{"kind":"bool","label":"是否在任务后执行脚本"},"IfScriptBeforeTask":{"kind":"bool","label":"是否在任务前执行脚本"},"Name":{"kind":"str","label":"用户名","raw":"WindowsNameString"},"Notes":{"kind":"str","label":"备注"},"RemainedDay":{"kind":"int","label":"剩余天数"},"Resource":{"kind":"enum","label":"游戏资源","options":["官服","国际服"]},"ScriptAfterTask":{"kind":"str","label":"任务后脚本路径","raw":"FilePath"},"ScriptBeforeTask":{"kind":"str","label":"任务前脚本路径","raw":"FilePath"},"Status":{"kind":"bool","label":"用户状态"},"Tag":{"kind":"str","label":"用户标签列表（JSON字符串，TagItem的dict列表）","raw":"Virtual[str]"}}},"Notify":{"kind":"object","ref":"OkwwUserConfig.NotifyFields","fields":{"Enabled":{"kind":"bool","label":"是否启用用户通知"},"IfSendMail":{"kind":"bool","label":"是否发送邮件"},"IfSendStatistic":{"kind":"bool","label":"是否发送用户统计信息"},"IfServerChan":{"kind":"bool","label":"是否启用 Server 酱"},"PushLogMode":{"kind":"enum","label":"任务报告节点详情的推送模式（log_box 采集的关键节点）： 关闭 = 不采集；逐条 = 采集并逐条带回时间戳；汇总 = 采集并按状态聚合","options":["关闭","逐条","汇总"]},"ServerChanKey":{"kind":"str","label":"Server 酱密钥"},"ToAddress":{"kind":"str","label":"用户收件地址"}}},"Task":{"kind":"object","ref":"OkwwUserConfig.TaskFields","fields":{"AdditionalTasks":{"kind":"list","label":"每日任务后运行的附加任务","itemKind":"enum","itemOptions":["Check Weekly Garden","Auto Farm all Nightmare Nest","Merge Echo If discarded > 1000","Teleport and Farm 4C Echo"]},"FarmNightmareNestForDailyEcho":{"kind":"bool","label":"使用梦魇巢穴完成日常声骸"},"MaterialSelection":{"kind":"enum","label":"模拟领域材料","options":["Resonator EXP","Weapon EXP","Shell Credit"]},"WhichForgeryChallengeToFarm":{"kind":"int","label":"凝素领域序号"},"WhichTacetSuppressionToFarm":{"kind":"int","label":"无音区序号"},"WhichToFarm":{"kind":"enum","label":"MAS 仅接管 DailyTask 及 DailyTask 高频设置；账号切换由 MAS 侧 account_switch 实现，不再暴露上游 MultiAccountDailyTask。 每日任务体力用途","options":["Tacet Suppression","Forgery Challenge","Simulation Challenge"]}}}},"OkNteConfig":{"Data":{"kind":"object","ref":"OkNteUserConfig.DataFields","fields":{"LastProxyDate":{"kind":"str","label":"上次代理日期","raw":"datetime"},"LastProxyStatus":{"kind":"enum","label":"上次代理状态（未知/成功/失败）","options":["未知","成功","失败","维护中"]},"LastTaskIndex":{"kind":"int","label":"上次运行的 ok-nte 任务序号（-t N）"},"ProxyTimes":{"kind":"int","label":"代理次数"}}},"Info":{"kind":"object","ref":"OkNteUserConfig.InfoFields","fields":{"Base":{"kind":"enum","label":"base 来源（shared=共享、independent=独立、native=脚本原生配置）","options":["shared","independent","native"]},"Id":{"kind":"str","label":"账号"},"IfQuickConfig":{"kind":"bool","label":"是否启用快速配置（与配置来源独立）"},"IfScriptAfterTask":{"kind":"bool","label":"是否在任务后执行脚本"},"IfScriptBeforeTask":{"kind":"bool","label":"是否在任务前执行脚本"},"Name":{"kind":"str","label":"用户名","raw":"WindowsNameString"},"Notes":{"kind":"str","label":"备注"},"Password":{"kind":"str","label":"密码"},"RemainedDay":{"kind":"int","label":"剩余天数"},"Resource":{"kind":"enum","label":"游戏资源","options":["官服"]},"ScriptAfterTask":{"kind":"str","label":"任务后脚本路径","raw":"FilePath"},"ScriptBeforeTask":{"kind":"str","label":"任务前脚本路径","raw":"FilePath"},"Status":{"kind":"bool","label":"用户状态"},"Tag":{"kind":"str","label":"用户标签列表（JSON字符串，TagItem的dict列表）","raw":"Virtual[str]"}}},"Notify":{"kind":"object","ref":"OkNteUserConfig.NotifyFields","fields":{"Enabled":{"kind":"bool","label":"是否启用通知"},"IfSendMail":{"kind":"bool","label":"是否发送邮件通知"},"IfSendStatistic":{"kind":"bool","label":"是否发送统计信息"},"IfServerChan":{"kind":"bool","label":"是否使用Server酱推送"},"PushLogMode":{"kind":"enum","label":"任务报告节点详情的推送模式（log_box 采集的关键节点）： 关闭 = 不采集；逐条 = 采集并逐条带回时间戳；汇总 = 采集并按状态聚合","options":["关闭","逐条","汇总"]},"ServerChanKey":{"kind":"str","label":"ServerChanKey"},"ToAddress":{"kind":"str","label":"邮件接收地址"}}},"Task":{"kind":"object","ref":"OkNteUserConfig.TaskFields","fields":{"ExitOnFinish":{"kind":"bool","label":"任务结束后退出（-e）"},"TaskIndex":{"kind":"int","label":"ok-nte.exe -t N -e；新版上游 DailyRoutineTask 是 -t 2"}}}},"BetterGIConfig":{"Data":{"kind":"object","ref":"BetterGIUserConfig.DataFields","fields":{"LastProxyDate":{"kind":"str","label":"上次代理日期","raw":"datetime"},"LastProxyStatus":{"kind":"enum","label":"上次代理状态（未知/成功/失败）","options":["未知","成功","失败","维护中"]},"ProxyTimes":{"kind":"int","label":"代理次数"}}},"Info":{"kind":"object","ref":"BetterGIUserConfig.InfoFields","fields":{"Base":{"kind":"enum","label":"base 来源（shared=共享/independent=独立/native=原生）","options":["shared","independent","native"]},"Id":{"kind":"str","label":"账号"},"IfQuickConfig":{"kind":"bool","label":"是否启用快速配置（与配置来源独立，按用户保存）"},"IfScriptAfterTask":{"kind":"bool","label":"是否在任务后执行脚本"},"IfScriptBeforeTask":{"kind":"bool","label":"是否在任务前执行脚本"},"IfUseMasConfig":{"kind":"bool","label":"兼容旧版用户独立一条龙配置"},"Name":{"kind":"str","label":"用户名","raw":"WindowsNameString"},"Notes":{"kind":"str","label":"备注"},"Password":{"kind":"str","label":"密码"},"RemainedDay":{"kind":"int","label":"剩余天数"},"ScriptAfterTask":{"kind":"str","label":"任务后脚本路径","raw":"FilePath"},"ScriptBeforeTask":{"kind":"str","label":"任务前脚本路径","raw":"FilePath"},"Status":{"kind":"bool","label":"用户状态"},"Tag":{"kind":"str","label":"用户标签列表（JSON字符串，TagItem的dict列表）","raw":"Virtual[str]"}}},"Notify":{"kind":"object","ref":"BetterGIUserConfig.NotifyFields","fields":{"Enabled":{"kind":"bool","label":"是否启用用户通知"},"IfSendDropStatistics":{"kind":"bool","label":"是否统计掉落（BGI「奖励识别」）：默认开启；开启后运行前强制打开奖励识别， 并把日志里的逐轮识别结果汇总进统计通知"},"IfSendMail":{"kind":"bool","label":"是否发送邮件"},"IfSendStatistic":{"kind":"bool","label":"是否发送用户统计信息"},"IfServerChan":{"kind":"bool","label":"是否启用 Server 酱"},"PushLogMode":{"kind":"enum","label":"任务报告节点详情的推送模式（一条龙/执行层分步表）： 关闭 = 不注入；逐条 = 逐条带回时间戳；汇总 = 按状态聚合","options":["关闭","逐条","汇总"]},"ServerChanKey":{"kind":"str","label":"Server 酱密钥"},"ToAddress":{"kind":"str","label":"用户收件地址"}}},"OneDragon":{"kind":"object","ref":"BetterGIUserConfig.OneDragonFields","fields":{"AutoBossStrategyName":{"kind":"str","label":"战斗策略（对应 BetterGI 一条龙的 AutoBossStrategyName，留空不覆盖） 默认「根据队伍自动选择」为 BetterGI 内置策略名"},"CustomGroups":{"kind":"str","label":"自定义配置组列表：JSON 数组字符串，元素为 {\"name\": str, \"enabled\": bool}","raw":"JsonListString"},"DailyRewardPartyName":{"kind":"str","label":"领取奖励队伍（对应 BetterGI 一条龙的 DailyRewardPartyName，留空不覆盖）"},"Groups":{"kind":"list","label":"一条龙要执行的内置配置组（按组名，默认全部 8 组开启）","itemKind":"str"},"IfUseCustomGroups":{"kind":"bool","label":"是否管理自定义配置组（总开关；OFF 时沿 BetterGI 原生设置，自定义组原样保留）"},"IfUseTeams":{"kind":"bool","label":"「队伍配置」总开关（胶囊开关）：ON 时表格内队伍参与运行时「战斗场景」选队； OFF 时数据保留但不参与匹配（通用队伍 PartyName/AutoBossStrategyName 照旧生效）。"},"PartyName":{"kind":"str","label":"战斗队伍（对应 BetterGI 一条龙的通用 PartyName，留空不覆盖）"},"Plan":{"kind":"str","label":"一条龙执行计划（Plan）JSON 字符串：{version, steps:[{uid,kind,name,enabled,settings}]}。 战斗 4 项（自动秘境/自动地脉花/自动幽境危战/自动首领讨伐）直连执行层时由本字段 承载其 per-任务参数；右栏对应设置仅写入本字段（不落原生一条龙配置）。"},"Queue":{"kind":"str","label":"一条龙队列（可视化编排）：JSON 数组字符串，按执行顺序存储，元素为 {\"kind\": str, \"name\": str}（kind ∈ builtin/js/pathing/scriptgroup/custom， 内置组名命中时后端强制 builtin）。仅表达顺序与成员（含同名重复实例）， 行启停仍由 Groups / CustomGroups 承载；为空或非法时回退旧行为 （按副本 TaskOrder 相对顺序，不重排）。","raw":"JsonListString"},"Teams":{"kind":"str","label":"队伍配置表：JSON 数组字符串，数组顺序即界面展示顺序（可拖拽重排），元素为 {\"name\": str,            # 队伍名称（游戏内队伍名） \"strategy\": str,        # 战斗策略名（留空 = 跟随通用策略 AutoBossStrategyName） \"scenes\": {             # 战斗场景（可跨标签页任意叠加，空则本行不参与匹配） \"domain\": [{\"region\": str, \"domain\": str, \"reward\": str}],   # 秘境：地区/秘境名/奖励档 \"leyline\": [{\"country\": str, \"type\": str}],                  # 地脉花：地区/地脉类型 \"boss\": [{\"region\": str, \"boss\": str}]},                     # 首领讨伐：地区/首领名 \"note\": str,            # 备注 \"enabled\": bool}        # 启用状态 序号 0 的「通用队伍」不落本字段（直绑 PartyName / AutoBossStrategyName）。 运行期由 team_resolver 按 L1 精确匹配 + 随机选取，写入 Plan 步骤的 masTeamOverride / masStrategyOverride（最高优先级，压过每周行与步骤级字段）。","raw":"JsonListString"},"UseExecutionLayer":{"kind":"bool","label":"是否启用「直连执行层」：战斗 4 项由 MAS 自编排 Plan 驱动（按需求恒开，预留开关）。"}}},"Switch":{"kind":"object","ref":"BetterGIUserConfig.SwitchFields","fields":{"GamePath":{"kind":"str","label":"游戏客户端路径（用户级覆盖，可空）：官服/B服/国际服是三个互相隔离的客户端， B站账号只能登录B服客户端。留空 = 跟随 BetterGI 全局配置的游戏路径；填写后该 用户运行时由 MAS 按此路径临时拉起游戏（不修改 BetterGI 配置），实现同脚本 混服用户各用各的客户端","raw":"FilePath"},"Resource":{"kind":"enum","label":"切换账号配置（BetterGI「切换账号多模式」脚本专项适配） 账号/密码复用 Info.Id / Info.Password（密码经 EncryptValidator 加密） 切换模式不再由用户配置，运行时按密码是否填写推断： 填密码 → 「账号+密码+OCR」，未填 → 「下拉列表」；B服 强制「B服切换另一个账号匹配+键鼠」。 游戏服务器（账号所在服务器：官服/B服/国际服各服务器）","options":["官服","B服","亚服","欧服","美服","港澳台服"]},"Uid":{"kind":"str","label":"账号 UID（可不填，切换前识别一致将不执行切换动作；仅 BetterGI 脚本方式生效）"}}},"Task":{"kind":"object","ref":"BetterGIUserConfig.TaskFields","fields":{"OneDragonConfigName":{"kind":"str","label":"BetterGI「一条龙」配置名，对应脚本一条龙页面中已保存的配置名称"}}}},"ZzzOdConfig":{"Data":{"kind":"object","ref":"ZzzOdUserConfig.DataFields","fields":{"LastProxyDate":{"kind":"str","label":"上次代理日期","raw":"datetime"},"LastProxyStatus":{"kind":"enum","label":"上次代理状态（未知/成功/失败）","options":["未知","成功","失败"]},"LauncherLastGood":{"kind":"enum","label":"智能启动器模式最近一次成功运行的启动器（\"\"=尚未记录；下次智能优先用它）","options":["","原始","集成"]},"ProxyTimes":{"kind":"int","label":"代理次数"}}},"Game":{"kind":"object","ref":"ZzzOdUserConfig.GameFields","fields":{"Account":{"kind":"str","label":"登录账号（手机号/邮箱；留空沿用 zzz-od 已保存的登录态）"},"BilibiliAccountName":{"kind":"str","label":"B服登录账号名"},"CustomWinTitle":{"kind":"str","label":"自定义窗口标题"},"Dx12":{"kind":"bool","label":"DX12 启动（MAS 便捷开关：注入时把 -use-d3d12 合并进一条龙的 launch_argument_advance；上游无独立字段，勾选框是唯一权威）"},"FullScreen":{"kind":"enum","label":"全屏模式（上游枚举原值为字符串：'0'=窗口化 '1'=全屏）","options":["0","1"]},"GameLanguage":{"kind":"enum","label":"游戏界面语言","options":["cn","en"]},"GamePath":{"kind":"str","label":"游戏 exe 完整路径（ZenlessZoneZero.exe）","raw":"FilePath"},"GameRegion":{"kind":"enum","label":"游戏区服（zzz-od game_account.yml 的 game_region 取值）","options":["cn","cn_b","us","eu","asia","twhkmo"]},"LaunchArgument":{"kind":"bool","label":"一条龙游戏启动参数（game.yml 六字段，照抄上游 BasicGameConfig 默认值与取值；一条龙启动游戏时消费，总开关关闭则全部不生效）： 启动参数总开关"},"LaunchArgumentAdvance":{"kind":"str","label":"高级参数（原样透传给一条龙拼接，上游不解析，不做 shlex 校验）"},"Monitor":{"kind":"enum","label":"显示器序号（上游枚举原值为字符串）","options":["1","2","3","4"]},"Password":{"kind":"str","label":"登录密码（DPAPI 加密落盘，注入/回读写 game_account.yml 时经 get/set 自动加解密）"},"Platform":{"kind":"enum","label":"游戏平台（上游枚举 GamePlatformEnum.PC 的真实值为大写 'PC'）","options":["PC"]},"PopupWindow":{"kind":"bool","label":"无边框窗口（一条龙拼参时转 -popupwindow）"},"ScreenSize":{"kind":"enum","label":"窗口尺寸（上游枚举原值）","options":["1920x1080","2560x1440","3840x2160"]},"UseCustomWinTitle":{"kind":"bool","label":"是否使用自定义窗口标题"}}},"Info":{"kind":"object","ref":"ZzzOdUserConfig.InfoFields","fields":{"Base":{"kind":"enum","label":"base 来源（shared=共享/independent=独立/native=原生）","options":["shared","independent","native"]},"IfQuickConfig":{"kind":"bool","label":"是否启用快速配置（已封锁，仅保留字段兼容存量数据：原生来源在 load/update 归一为关，共享/独立来源不消费本开关）"},"IfScriptAfterTask":{"kind":"bool","label":"是否在任务后执行脚本"},"IfScriptBeforeTask":{"kind":"bool","label":"是否在任务前执行脚本"},"LauncherMode":{"kind":"enum","label":"一条龙启动器选择（原生/独立两态通用）： 自动 = 优先用「上次成功」的启动器，启动失败自动换另一个重试并记住下一次 成功的那个；原始/集成 = 固定用对应启动器（对应 exe 未安装时回退可用项）","options":["自动","原始","集成"]},"Name":{"kind":"str","label":"用户名","raw":"WindowsNameString"},"Notes":{"kind":"str","label":"备注"},"RemainedDay":{"kind":"int","label":"剩余天数"},"ScriptAfterTask":{"kind":"str","label":"任务后脚本路径","raw":"FilePath"},"ScriptBeforeTask":{"kind":"str","label":"任务前脚本路径","raw":"FilePath"},"SlotIdx":{"kind":"int","label":"绑定的 zzz-od 实例槽下标（运行/配置会话内临时合成视图写回原生配置，非持久注册）：-1=未分配，首次运行或 「在一条龙内配置」时自动分配空闲 idx 并锁定该槽至会话结束， 此后配置会话与运行时注入都固定使用该槽。新槽从 MAS_SLOT_BASE（1001）起， 退到一条龙「升序找最小空号」够不到的高位段（上限 9999 与之一致放宽）"},"Status":{"kind":"bool","label":"用户状态"},"Tag":{"kind":"str","label":"用户标签列表（JSON字符串，TagItem的dict列表）","raw":"Virtual[str]"}}},"Notify":{"kind":"object","ref":"ZzzOdUserConfig.NotifyFields","fields":{"Enabled":{"kind":"bool","label":"是否启用用户通知"},"IfSendMail":{"kind":"bool","label":"是否发送邮件"},"IfSendStatistic":{"kind":"bool","label":"是否发送用户统计信息"},"IfServerChan":{"kind":"bool","label":"是否启用 Server 酱"},"PushLogMode":{"kind":"enum","label":"任务报告节点详情的推送模式（运行记录 diff 出的各任务结果）： 关闭 = 不采集；逐条 = 逐条带回时间戳；汇总 = 按状态聚合","options":["关闭","逐条","汇总"]},"ServerChanKey":{"kind":"str","label":"Server 酱密钥"},"ToAddress":{"kind":"str","label":"用户收件地址"}}},"OneDragon":{"kind":"object","ref":"ZzzOdUserConfig.OneDragonFields","fields":{"AfterDone":{"kind":"enum","label":"游戏结束后操作（仅 MAS 拉起的一条龙运行消费：CLI 传参 --close-game / --shutdown 60；无=不传参，游戏保持运行。 与一条龙原生 GUI 的「结束后」下拉无关——原生 after_done 只在 从 GUI 内启动运行时被消费，CLI 路径不读它）","options":["无","关闭游戏","关机"]},"AppList":{"kind":"str","label":"一条龙任务编排（JSON 数组字符串 [{\"app_id\": \"...\", \"enabled\": true}, ...]， 数组顺序即执行顺序；enabled=false 的任务由 zzz-od 跳过）"}}}},"BAAHConfig":{"Data":{"kind":"object","ref":"BAAHUserConfig.DataFields","fields":{"LastProxyDate":{"kind":"str","label":"上次代理日期","raw":"datetime"},"ProxyTimes":{"kind":"int","label":"代理次数"}}},"Info":{"kind":"object","ref":"BAAHUserConfig.InfoFields","fields":{"ActivityLineType":{"kind":"enum","label":"活动排期按哪个服判断，供「活动关优先」使用（Kivo 时间轴的原文拼写：JP / Globle / CN）","options":["JP","Globle","CN"]},"Base":{"kind":"enum","label":"base 来源（shared=共享/independent=独立/native=原生）","options":["shared","independent","native"]},"ConfigName":{"kind":"str","label":"默认使用的 BAAH 配置文件名（BAAH_CONFIGS 目录下的文件名，不含 .json 后缀）"},"IfEventFirst":{"kind":"bool","label":"活动期间自动把「活动关卡」任务排到最前并打开"},"IfQuickConfig":{"kind":"bool","label":"是否启用快速配置（与配置来源独立，按用户保存）"},"Name":{"kind":"str","label":"用户名称","raw":"WindowsNameString"},"Notes":{"kind":"str","label":"备注"},"RemainedDay":{"kind":"int","label":"剩余天数"},"StageMode":{"kind":"str","label":"关卡计划表；Fixed 表示按脚本配置","raw":"UUID | str"},"Status":{"kind":"bool","label":"是否启用"},"Tag":{"kind":"str","label":"用户标签信息","raw":"Virtual[str]"}}},"Notify":{"kind":"object","ref":"BAAHUserConfig.NotifyFields","fields":{"Enabled":{"kind":"bool","label":"是否启用通知"},"IfSendMail":{"kind":"bool","label":"是否发送邮件"},"IfSendStatistic":{"kind":"bool","label":"是否发送统计信息"},"IfServerChan":{"kind":"bool","label":"是否启用 Server 酱"},"ServerChanKey":{"kind":"str","label":"Server 酱密钥"},"ToAddress":{"kind":"str","label":"收件地址"}}}},"WhimboxConfig":{"Data":{"kind":"object","ref":"WhimboxUserConfig.DataFields","fields":{"LastProxyDate":{"kind":"str","label":"上次代理日期","raw":"datetime"},"LastProxyStatus":{"kind":"enum","label":"上次代理状态（未知/成功/失败）","options":["未知","成功","失败"]},"ProxyTimes":{"kind":"int","label":"代理次数"}}},"Info":{"kind":"object","ref":"WhimboxUserConfig.InfoFields","fields":{"Base":{"kind":"enum","label":"base 来源三态（shared=共享/independent=独立/native=原生）：共享/独立= 用 MAS 面板配置（当前运行行为一致，为后续特殊功能预留），原生=直接用奇想盒 自带配置（MAS 零写入）","options":["shared","independent","native"]},"IfQuickConfig":{"kind":"bool","label":"是否启用覆写层（快速配置，与来源独立，按账号保存，默认关）：开启时原生态 也会在任务前把面板覆盖集写入奇想盒（overlay，任务结束还原）；共享/独立态 面板本就是 base 来源，开关暂无额外消费点，为后续特殊功能预留。默认关保证 「原生=零写入」与 _write_config_or_hint 报错里「切原生绕开写入」的出路成立"},"IfScriptAfterTask":{"kind":"bool","label":"是否在任务后执行脚本"},"IfScriptBeforeTask":{"kind":"bool","label":"是否在任务前执行脚本"},"Name":{"kind":"str","label":"用户名","raw":"WindowsNameString"},"Notes":{"kind":"str","label":"备注"},"RemainedDay":{"kind":"int","label":"剩余天数"},"ScriptAfterTask":{"kind":"str","label":"任务后脚本路径","raw":"FilePath"},"ScriptBeforeTask":{"kind":"str","label":"任务前脚本路径","raw":"FilePath"},"Status":{"kind":"bool","label":"用户状态"},"Tag":{"kind":"str","label":"用户标签列表（JSON字符串，TagItem的dict列表）","raw":"Virtual[str]"}}},"Notify":{"kind":"object","ref":"WhimboxUserConfig.NotifyFields","fields":{"Enabled":{"kind":"bool","label":"是否启用用户通知"},"IfSendMail":{"kind":"bool","label":"是否发送邮件"},"IfSendStatistic":{"kind":"bool","label":"是否发送用户统计信息"},"IfServerChan":{"kind":"bool","label":"是否启用 Server 酱"},"ServerChanKey":{"kind":"str","label":"Server 酱密钥"},"ToAddress":{"kind":"str","label":"用户收件地址"}}},"OneDragon":{"kind":"object","ref":"WhimboxUserConfig.OneDragonFields","fields":{"IfRunAllAccounts":{"kind":"bool","label":"一条龙是否循环全部游戏账号（物化为上游 OneDragon.change_account； 账号列表由奇想盒运行期 OCR 动态发现，MAS 不做账号定向）"}}},"Task":{"kind":"object","ref":"WhimboxUserConfig.TaskFields","fields":{"Options":{"kind":"json","label":"目标/参数覆盖集：JSON map {键: 值}，键集来自任务目录 （上游 OneDragon 节托管字段），只存用户显式选择的值"},"Tasks":{"kind":"json","label":"步骤开关覆盖集：JSON map {步骤键: bool}，键集来自任务目录 （上游 OneDragonDefaultSteps 节），只存用户勾选结果"}}}}};
const SCRIPT_SCHEMA = {"MaaConfig":{"Emulator":{"kind":"object","ref":"MaaConfig.EmulatorFields","fields":{"Id":{"kind":"str","label":"模拟器 ID","raw":"UUID | str"},"Index":{"kind":"str","label":"模拟器索引"}}},"Info":{"kind":"object","ref":"MaaConfig.InfoFields","fields":{"Name":{"kind":"str","label":"MAA 脚本名称"},"Path":{"kind":"str","label":"MAA 路径","raw":"FolderPath"}}},"Run":{"kind":"object","ref":"MaaConfig.RunFields","fields":{"AnnihilationTimeLimit":{"kind":"int","label":"剿灭时间限制（分钟）"},"GameUpdateTimeLimit":{"kind":"int","label":"游戏更新时间限制（分钟）"},"HardTimeLimit":{"kind":"int","label":"单账号运行总时限（分钟），包含等待和全部重试"},"IfAutoInstallGameApk":{"kind":"bool","label":"是否允许自动下载并安装游戏安装包（仅官服）"},"IfCheckGameUpdate":{"kind":"bool","label":"是否在启动 MAA 前检查游戏更新"},"ProxyTimesLimit":{"kind":"int","label":"代理次数限制"},"RoutineTimeLimit":{"kind":"int","label":"日常时间限制（分钟）"},"RunTimesLimit":{"kind":"int","label":"运行次数限制"},"TaskTransitionMethod":{"kind":"enum","label":"任务切换方式","options":["NoAction","ExitGame","ExitEmulator"]}}},"Update":{"kind":"object","ref":"MaaConfig.UpdateFields","fields":{"TakeoverMigrationVersion":{"kind":"int","label":"更新接管一次性迁移版本","default":1},"MirrorChyanCDK":{"kind":"str","label":"本脚本的 Mirror 酱 CDK（加密存储，留空回退 MAS 全局配置）"},"TakeoverEnabled":{"kind":"bool","label":"是否接管 MAA 本体与资源更新（关=完全由 MAA 自行处理）"}}}},"MaaEndConfig":{"Game":{"kind":"object","ref":"MaaEndConfig.GameFields","fields":{"LaunchMode":{"kind":"enum","label":"游戏启动方式，Client 为历史迁移值","default":"Launcher","options":["Client","Launcher","MAS","MaaEnd"]},"Arguments":{"kind":"str","label":"终末地游戏启动参数","raw":"CliArgumentString"},"CloseOnFinish":{"kind":"bool","label":"结束后是否关闭游戏"},"ControllerType":{"kind":"str","label":"控制器类型"},"EmulatorId":{"kind":"str","label":"模拟器 ID","raw":"UUID | str"},"EmulatorIndex":{"kind":"str","label":"模拟器索引"},"IfAutoUpdate":{"kind":"bool","label":"是否在任务启动前检查并自动更新终末地 PC 客户端"},"LauncherPath":{"kind":"str","label":"鹰角官方启动器路径（Launcher.exe 或 Games.exe）","raw":"FilePath"},"Path":{"kind":"str","label":"终末地游戏路径","raw":"FilePath"},"RestoreDisplayType":{"kind":"enum","label":"关闭游戏时恢复的显示模式，与具体分辨率独立配置","options":["Window","Fullscreen"]},"RestoreResolution":{"kind":"enum","label":"关闭游戏时恢复分辨率；Original 复用启动前读取的注册表值","options":["Off","Original","1920x1080","2560x1440","3840x2160","Custom"]},"RestoreResolutionHeight":{"kind":"int","label":"自定义恢复分辨率高度"},"RestoreResolutionWidth":{"kind":"int","label":"自定义恢复分辨率宽度"},"SetResolution":{"kind":"bool","label":"是否在启动游戏时执行 MaaEnd 分辨率设置预任务"},"UpdateTimeLimit":{"kind":"int","label":"游戏客户端更新时长限制（分钟）"},"WaitTime":{"kind":"int","label":"等待时间（秒）"}}},"Info":{"kind":"object","ref":"MaaEndConfig.InfoFields","fields":{"Name":{"kind":"str","label":"MaaEnd 脚本名称"},"Path":{"kind":"str","label":"MaaEnd 路径","raw":"FolderPath"}}},"Run":{"kind":"object","ref":"MaaEndConfig.RunFields","fields":{"AccountSwitchMethod":{"kind":"enum","label":"账号切换方式（默认使用 MAAEND，MAS 为兼容入口）","options":["MAS","MAAEND"]},"HardTimeLimit":{"kind":"int","label":"单账号运行总时限（分钟），包含等待和全部重试"},"ProxyTimesLimit":{"kind":"int","label":"每日代理次数限制"},"RunTimeLimit":{"kind":"int","label":"运行超时阈值"},"RunTimesLimit":{"kind":"int","label":"运行次数限制"},"TaskTransitionMethod":{"kind":"enum","label":"任务切换方式","options":["NoAction","ExitGame"]}}}},"SrcConfig":{"Emulator":{"kind":"object","ref":"SrcConfig.EmulatorFields","fields":{"Id":{"kind":"str","label":"模拟器 ID","raw":"UUID | str"},"Index":{"kind":"str","label":"模拟器索引"}}},"Info":{"kind":"object","ref":"SrcConfig.InfoFields","fields":{"Name":{"kind":"str","label":"SRC 脚本名称"},"Path":{"kind":"str","label":"SRC 路径","raw":"FolderPath"}}},"Run":{"kind":"object","ref":"SrcConfig.RunFields","fields":{"GameUpdateTimeLimit":{"kind":"int","label":"游戏更新时间限制（分钟）"},"HardTimeLimit":{"kind":"int","label":"单账号运行总时限（分钟），包含等待和全部重试"},"IfAutoInstallGameApk":{"kind":"bool","label":"版本落后时是否由 MAS 自动下载并安装安装包"},"IfCheckGameUpdate":{"kind":"bool","label":"是否在登录游戏前检查游戏更新"},"ProxyTimesLimit":{"kind":"int","label":"代理次数限制"},"RunTimeLimit":{"kind":"int","label":"运行时间限制（分钟）"},"RunTimesLimit":{"kind":"int","label":"运行次数限制"},"TaskTransitionMethod":{"kind":"enum","label":"任务切换方式","options":["ExitGame","ExitEmulator"]}}}},"HSRConfig":{"Cloud":{"kind":"object","ref":"HSRConfig.CloudFields","fields":{"LastLogin":{"kind":"json","label":"各用户最近一次确认已登录的时间（user_id → ISO 时间），只读展示用， 由运行结束后的写回与「登录云游戏」接口维护"},"LoginTimeoutMinutes":{"kind":"int","label":"等待用户在浏览器窗口里手动登录的时间（分钟）"},"MaxQueueMinutes":{"kind":"int","label":"最长排队时间（分钟），同时计入每个模块的超时预算"},"UsePaidTime":{"kind":"bool","label":"云·星穹铁道（Game.Platform = Cloud）专用，映射到三月七的 cloud_game_* 键 是否允许消耗付费时长走快速排队通道（花钱的开关，默认关）"}}},"Game":{"kind":"object","ref":"HSRConfig.GameFields","fields":{"Enabled":{"kind":"bool","label":"是否由 MAS 管理游戏启停、进程监测和窗口操作（仅客户端平台）"},"ForceResolution1920x1080":{"kind":"bool","label":"启动游戏时临时覆盖 1920×1080 注册表分辨率"},"Path":{"kind":"str","label":"游戏路径","raw":"NativePath"},"Platform":{"kind":"enum","label":"游戏平台：本地客户端 / 云·星穹铁道（MAS 托管浏览器，只用三月七）。 OptionsValidator.correct() 回退的是 options[0]，Client 必须排第一。","options":["Client","Cloud"]},"RedeemCodesOnlyWhenChanged":{"kind":"bool","label":"仅在原生兑换码内容变化时执行兑换"},"WaitTime":{"kind":"int","label":"等待时间（秒）"}}},"Info":{"kind":"object","ref":"HSRConfig.InfoFields","fields":{"M7APath":{"kind":"str","label":"M7A 路径","raw":"FolderPath"},"Name":{"kind":"str","label":"HSR 脚本名称"},"SRAPath":{"kind":"str","label":"SRA 路径","raw":"FolderPath"},"SRAProfile":{"kind":"str","label":"SRA 配置档案（%APPDATA%\\SRA\\configs 下的文件名，不含扩展名；空串表示自动）","raw":"SRAProfileName"}}},"Managed":{"kind":"object","ref":"HSRConfig.ManagedFields","fields":{"Options":{"kind":"json","label":"托管任务选项 JSON"},"TaskMapping":{"kind":"json"}}},"Run":{"kind":"object","ref":"HSRConfig.RunFields","fields":{"DailyTimeLimit":{"kind":"int","label":"日常任务超时限制（分钟）"},"LowPerformanceMode":{"kind":"bool","label":"低性能兼容模式（仅三月七差分宇宙使用，映射到 weekly_divergent_stable_mode）"},"ProxyTimesLimit":{"kind":"int","label":"代理次数限制"},"RunTimesLimit":{"kind":"int","label":"失败任务最大尝试次数"},"WeeklyTimeLimit":{"kind":"int","label":"周常任务超时限制（分钟）"}}},"Stage":{"kind":"object","ref":"HSRConfig.StageFields","fields":{"Channel":{"kind":"enum","label":"体力关卡通道","options":["CalyxGolden","CalyxCrimson","Relic","Ornament"]},"ScriptEchoOfWar":{"kind":"json","label":"历战余响脚本原生字段 JSON"},"ScriptStage":{"kind":"json","label":"主刷关卡脚本原生字段 JSON"}}},"TaskMapping":{"kind":"object","ref":"HSRConfig.TaskMappingFields","fields":{"CurrencyWars":{"kind":"enum","label":"货币战争模块执行脚本","options":["M7A","SRA"]},"Daily":{"kind":"enum","label":"日常模块执行脚本","options":["M7A","SRA"]},"DivergentUniverse":{"kind":"enum","label":"差分宇宙模块执行脚本","options":["M7A","SRA"]},"ReceiveRewards":{"kind":"enum","label":"领取奖励模块执行脚本","options":["M7A","SRA"]}}},"TaskOpt":{"kind":"object","ref":"HSRConfig.TaskOptFields","fields":{"EchoOfWarWeekday":{"kind":"enum","label":"历战余响开始刷的星期（周一 ~ 周日）","options":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]}}},"TaskSwitch":{"kind":"object","ref":"HSRConfig.TaskSwitchFields","fields":{"CurrencyWars":{"kind":"bool","label":"货币战争模块开关"},"Daily":{"kind":"bool","label":"日常模块开关"},"DivergentUniverse":{"kind":"bool","label":"差分宇宙模块开关"},"ReceiveRewards":{"kind":"bool","label":"领取奖励模块开关"}}},"Update":{"kind":"object","ref":"HSRConfig.UpdateFields","fields":{"AutoUpdateMode":{"kind":"enum","label":"外部脚本（M7A / SRA）的自动更新。默认关闭：这两个是用户自己安装、 自带更新器的第三方工具，未经开启就改写它们的目录属于越界；停留在 某个旧版也是真实需求。 只有 AfterRun 一档，没有 BeforeRun：更新的收益本来就落在下一次运行 上，没有理由让当前这轮先等一个 170–750MB 的下载。想立刻更新走配置 页的手动按钮。留成枚举而非布尔，是为了日后要加档时不必做 bool→enum 迁移（MaaFW 正为此背着一个废弃字段）。 选项顺序有意义：OptionsValidator.correct() 回退的是 **options[0]**， 不是这里的默认值，Off 必须排在最前。","options":["Off","AfterRun"]},"Channel":{"kind":"enum","label":"更新渠道，两个引擎共用。Mirror 酱还支持 alpha，**故意不开放**—— 那是项目方的内部验证档。这两个值必须与前端选项和 schema 的 Literal 一致，三处任一多给一档，用户选了就会 422 或被静默纠回默认值。","options":["stable","beta"]},"M7ASource":{"kind":"enum","label":"下载源按引擎拆开：两者可用的源本就不同，共用一项给不出不同默认值。 版本检查恒走 Mirror 酱的免 CDK 接口（自建站没有 latest 接口，只能用 tag 拼 URL，靠这条口径补上）；这里只决定字节从哪来，且**不做自动 分流**——选了 Mirror 酱而 CDK 不可用时报明原因并跳过，不悄悄换成 GitHub，用户得知道自己在从哪下载。 M7A 没有上 AUTO-MAS 自建站，所以只有两个源，默认 GitHub。","options":["GitHub","MirrorChyan"]},"MirrorChyanCDK":{"kind":"str","label":"Mirror 酱 CDK，由用户自己填，**不做全局兜底**：全局那个服务的是 AUTO-MAS 自身的更新，和外部脚本不是一回事，串在一起只会让人猜自己 在用哪个。选 Mirror 酱作为下载源时这一项必填。"},"SRASource":{"kind":"enum","label":"SRA 默认自建站：免 CDK、不限流、sha256 与 GitHub 逐字节一致，且 SRA 上游 CI 会主动往这里推送，其自带更新器也有 AUTO-MAS 这一档。","options":["AutoSite","GitHub","MirrorChyan"]}}}},"MaaFWConfig":{"Device":{"kind":"object","ref":"MaaFWConfig.DeviceFields","fields":{"AdbAddress":{"kind":"str","label":"ADB 地址，留空时启动脚本级模拟器获取"},"AdbInputMethods":{"kind":"int","label":"ADB 输入方法，默认优先模拟器增强，失败后回退到 MaaTouch / MiniTouch / ADB 同上，仅第二层适用；第一层运行期写死 InputMethods=18446744073709551607"},"AdbPath":{"kind":"str","label":"ADB 路径，留空时从 MAS 模拟器配置或 MaaFW Toolkit 推导","raw":"FilePath"},"AdbScreencapMethods":{"kind":"int","label":"ADB 截图方法，默认优先模拟器增强，失败后回退到 ADB 截图 仅第二层（MAS 进程内 runner）适用：第一层由外壳自己创建控制器，运行期按 M9A 专项的既验证取值写死（ScreencapMethods=64），本项不参与外部运行， 接线前不要暴露到前端，否则用户改了不会生效也没有提示"},"GamepadType":{"kind":"int","label":"Gamepad 类型，默认 Xbox360"},"HWnd":{"kind":"int","label":"Win32 / Gamepad 窗口句柄，0 表示未指定"},"PlayCoverAddress":{"kind":"str","label":"PlayCover 地址"},"PlayCoverUuid":{"kind":"str","label":"PlayCover UUID"},"Win32KeyboardMethod":{"kind":"int","label":"Win32 键盘方法，0 表示使用 interface 声明或 MaaFW 默认值"},"Win32MouseMethod":{"kind":"int","label":"Win32 鼠标方法，0 表示使用 interface 声明或 MaaFW 默认值"},"Win32ScreencapMethod":{"kind":"int","label":"Win32 截图方法，0 表示使用 interface 声明或 MaaFW 默认值"}}},"Embedded":{"kind":"object","ref":"MaaFWConfig.EmbeddedFields","fields":{"FollowSource":{"kind":"bool","label":"跟随来源目录（开发者模式），默认关。开着时每次运行前比一下来源目录（投影会带走的 文件的路径 + 大小 + 修改时间），变了就重新导入到这个脚本自己的私有渠道（不比版本、 不与同项目其它脚本共用版本），不做项目更新；关掉后回到 Update.Channel 的组。 见 tools/embedded/embedded_project.py「跟随来源目录」一节。"},"ImportedAt":{"kind":"str","label":"导入时间，仅展示；空值表示尚未导入","default":null,"raw":"datetime"},"Report":{"kind":"json","label":"投影报告（省下多少、外壳家族、排除条数与原因），JSON 字符串"},"SourceVersion":{"kind":"str","label":"由 AUTO-MAS 内嵌一份按 interface 白名单投影的副本来运行。副本在 data/mfw/<脚本 uuid 前 12 位>/，由脚本 ID 推出、不进配置、用户不可手改； Info.Path 继续存用户选的来源目录。更新落地时同样只写白名单内的条目。 导入时来源的 interface 版本，仅展示"}}},"Emulator":{"kind":"object","ref":"MaaFWConfig.EmulatorFields","fields":{"Id":{"kind":"str","label":"模拟器 ID，ADB controller 留空地址时使用","raw":"UUID | str"},"Index":{"kind":"str","label":"模拟器索引"}}},"Game":{"kind":"object","ref":"MaaFWConfig.GameFields","fields":{"Arguments":{"kind":"str","label":"游戏启动参数","raw":"CliArgumentString"},"Hotkeys":{"kind":"json","label":"脚本级键位（PI v2.8 hotkey 选项）：``{option 名: {字段名: 组合键字符串}}``， 组合键写成「修饰键+…+主键」（如 ``\"Ctrl+E\"``）。只存与 interface 默认不同的 字段；运行时叠加到每个任务实际生效的 hotkey 选项上，盖过用户快照 / 预设里的值。 仅 Win32 控制器生效（Adb 等其他控制器不叠加）。interface 里已没有的 option / 字段静默忽略，映射不了的值告警后回落到快照 / 默认值（runner/run_plan.py）。"},"LaunchMode":{"kind":"enum","label":"游戏生命周期模式","options":["DirectExe","AttachOnly"]},"LaunchPath":{"kind":"str","label":"DirectExe 模式下 MAS 启动的游戏 exe","raw":"FilePath"},"PackageName":{"kind":"str","label":"安卓游戏包名，Adb controller 用：启动模拟器时顺带把游戏拉起来。 留空表示从项目的 pipeline 里自动识别（见 embedded/game_package.py）； 自动识别是启发式的，填了这里就以这里为准。识别不出且没填则不启动游戏。"},"UnityResolution":{"kind":"enum","label":"DirectExe 模式下，启动游戏前按 exe 路径反查 Unity 注册表，临时把分辨率改成所选 尺寸的窗口模式，游戏关闭后恢复原值（tools/embedded/game_resolution.py）。 只对 Unity 引擎的游戏有效；游戏已在运行时不改。Off 表示不碰。","options":["Off","1920x1080","1280x720"]},"WaitTime":{"kind":"int","label":"游戏启动等待时间（秒）：既是等窗口出现的上限，也是窗口出现后等画面稳定的上限。 Unity 游戏窗口出现时还在黑屏加载，登录界面往往要二三十秒后才渲染出来； MaaEnd 的 SceneManager 见连续画面不变十几秒就判「环境识别异常」直接失败。 等画面时 worker 每秒截一帧，有内容且连续几秒不变就提前下发，等不到才等满； MaaFW 初始化（加载资源、连 controller、起 agent）与之重叠而不是干等。 只对本轮由 MAS 拉起的游戏生效，AttachOnly 与「游戏已在运行」不等画面。"}}},"Info":{"kind":"object","ref":"MaaFWConfig.InfoFields","fields":{"Controller":{"kind":"str","label":"MaaFW controller 名称，留空时按 interface 和设备配置自动选择"},"Name":{"kind":"str","label":"MaaFW 脚本名称"},"Path":{"kind":"str","label":"MaaFW 项目的导入来源目录，应包含 interface.json；导入后可删，删了也原样保留","raw":"NativePath"},"ProjectLabel":{"kind":"str","label":"项目标签，可用于区分同一 ProjectInterface 的不同实例"},"Resource":{"kind":"str","label":"MaaFW resource 名称，留空时选择匹配 controller 的第一个 resource"}}},"Run":{"kind":"object","ref":"MaaFWConfig.RunFields","fields":{"DailyOnceTasks":{"kind":"str","label":"每天正常完成一次后，当天剩余时间跳过的 MaaFW 任务名列表","raw":"JsonListString"},"GameUpdateMode":{"kind":"enum","label":"游戏客户端更新：Off 不检查 / Check 只检查，落后时本次判失败并提示手动更新 / AutoInstall 落后时自动下载安装包并 adb 安装（保留游戏数据）。只在特调实现了 游戏更新钩子（当前只有 M9A）且 controller 是 ADB 时生效，通用 MaaFW 不读。 Off 必须排第一：OptionsValidator 纠错回退的是 options[0]。","options":["Off","Check","AutoInstall"]},"LoopGuard":{"kind":"bool","label":"原地打转检测（实验性，默认关）。任务在短周期里反复执行同一串节点（周期 ≤ 8 步、每轮都有点击 / 滑动等物理动作）、识别结果又几乎不变时判定卡死：≥ 200 轮且持续 ≥ 10 分钟就停掉这个任务，收尾与单任务超时同一口径（截图、第一个任务或关键任务 结束本轮，其余记失败后继续）。判据见 tools/core/runner/loop_guard.py。"},"MonthlyOnceTasks":{"kind":"str","label":"每月正常完成一次后，本月剩余时间跳过的 MaaFW 任务名列表","raw":"JsonListString"},"ProxyTimesLimit":{"kind":"int","label":"运行引擎，决定「谁来跑」： 代理次数限制"},"RunTimeLimit":{"kind":"int","label":"单次运行时间限制（分钟），套在单个用户的整次运行上。截止时刻随 job 文件交给 worker：到点它自己停掉当前任务、截一张超时图、带回已完成的任务；宿主只在 worker 没能及时停下时才强杀（那时既没有截图也没有进度）。MaaFW 项目一轮日常 动辄几十分钟，30 分钟默认值实测常被误伤，放宽到 120。"},"RunTimesLimit":{"kind":"int","label":"运行次数限制。重试不关游戏、不再等启动，从当前画面接着跑； 脚本自己的加载超时（MaaEnd 回大世界 20s）一次抖动就把整轮判失败， 只给一次机会时用户看到的就是「从来没成功过」，默认与其他专项一样 3 次。"},"TaskTimeLimit":{"kind":"int","label":"单个任务的时限（分钟），0 表示不限。某个任务卡住时到点只停它、截一张超时图， 记一条任务失败后接着跑后面的任务（计划里第一个任务超时则结束本轮）；不再让 一个卡住的任务吃掉整轮 RunTimeLimit 的时间。 默认 45 而不是 30：M9A 智能均衡刷材料正常 1–22 分钟，自动深眠在新内容日 实测 33.7 分钟，30 会误伤正常运行。"},"TaskTimeLimitOverrides":{"kind":"json","label":"按任务名覆盖的单任务时限（分钟），键是 MaaFW 任务名；值 0 表示该任务不限。 默认值由类属性 DEFAULT_TASK_TIME_LIMIT_OVERRIDES 决定（特调可内置几条）； 只在配置里没有这个键时生效，用户存过的值（含清空成 {}）原样保留。"},"WeeklyOnceTasks":{"kind":"str","label":"每周正常完成一次后，本周剩余时间跳过的 MaaFW 任务名列表","raw":"JsonListString"}}},"Selection":{"kind":"object","ref":"MaaFWConfig.SelectionFields","fields":{"Controller":{"kind":"str","label":"当前阶段保留：manager.py 仍从 Selection.* 读取运行范围， 字段迁移到 Info.* / 用户任务配置属于后续 P3 前端回收。 选中的 controller 列表","raw":"JsonListString"},"Resource":{"kind":"str","label":"选中的 resource 列表","raw":"JsonListString"},"Tasks":{"kind":"str","label":"选中的 task 列表","raw":"JsonListString"}}},"Task":{"kind":"object","ref":"MaaFWConfig.TaskFields","fields":{"Templates":{"kind":"str","label":"用户页任务队列的自定义模板，同一脚本的用户共用。JSON 列表，每项 ``{\"name\": 模板名, \"snapshot\": {taskOrder, taskChecked, taskOptions, taskLabels?}}``， 快照形状同用户的 Task.TaskSnapshot（键是任务实例 id），但不含受管任务、密码字段 与全局选项（globalOptions 归各用户自己）； 名称在脚本内唯一。运行流程不读它，只由用户页套用到某个用户的队列。","raw":"JsonListString"}}},"Update":{"kind":"object","ref":"MaaFWConfig.UpdateFields","fields":{"AutoUpdateMode":{"kind":"enum","label":"项目自动更新时机：Off 不更新 / BeforeRun 运行前 / AfterRun 全部用户跑完后。 由 embedded_manager 在用户任务之外执行，耗时不计入 Run.RunTimeLimit。","options":["Off","BeforeRun","AfterRun"]},"Channel":{"kind":"enum","label":"更新渠道只有稳定版与测试版，默认稳定版，要测试版由用户手动切。 不给「跟随全局」：全局那个 Update.Channel 是 MAS 自身的发布通道， 和脚本本体的版本档位是两回事，串在一起只会让人猜。 Mirror 酱还支持 channel=alpha，**故意不开放**——那是项目方的内部 验证档，稳定性无保证，而这里更新的是用户日常在跑的脚本本体。 这两个值必须与前端 updateChannelOptions 和 schema 的 Literal 一致： 三处任一多给一档，用户选了就会 422 或被静默纠回默认值。 旧配置里的空串现在是非法值，会被 correct() 回退成 options[0]， 即 stable——这里的顺序同样不能随意调换。","options":["stable","beta"]},"GitHubAssetPattern":{"kind":"str","label":"[已废弃] GitHub release asset 文件名匹配模式"},"GitHubRepo":{"kind":"str","label":"[已废弃] GitHub 仓库/tag/asset 覆盖：仓库与资产名改为从 interface.json 和目录名自动推导，运行流程不再读取；保留一个版本兼容旧配置文件后删除。"},"GitHubTag":{"kind":"str","label":"[已废弃] GitHub release tag 覆盖"},"IfAutoUpdate":{"kind":"bool","label":"[已废弃] 旧布尔开关，只在 load() 里迁移为 AutoUpdateMode（False → Off）， 运行流程不再读取；保留一个版本兼容旧配置文件后删除。"},"MirrorChyanCDK":{"kind":"str","label":"Mirror 酱 CDK，由用户自己填。**不做全局兜底**：全局那个服务的是 AUTO-MAS 自身的更新，和脚本本体不是一回事，串在一起只会让人猜 自己在用哪个。选 Mirror 酱作为下载源时这一项必填。 （合并逻辑见 tools/embedded/update_credentials.py）"},"ProxyAddress":{"kind":"str","label":"脚本级网络代理，给这个项目的更新包下载与运行环境安装（uv / pip、 binding 源码兜底）用。与 CDK / 渠道不同，这一项**留空就跟随全局** `Update.ProxyAddress`（设置 → 其他 → 网络代理），填了就只走自己的： 代理解决的是「这台机器连不连得上」，多数人全局一份就够，个别项目 的源在别的网络才需要单独指。格式同全局项，`host:port` 不带协议时 补 `http://`（合并逻辑见 tools/embedded/update_credentials.py）。"},"Source":{"kind":"enum","label":"更新包的下载源，由用户显式选择——**不做自动分流**。 版本检查始终走 Mirror 酱（无 CDK 也能查），但下载去哪由这一项决定： 选 Mirror 酱就必须自己填 CDK，CDK 不可用时明确报错，不悄悄换成 GitHub——用户得知道自己在从哪下载，出问题才查得动。 默认 GitHub：零配置即可用，与全局 Update.Source 的默认值一致。 选项顺序有意义：OptionsValidator.correct() 回退的是 **options[0]**， 不是这里的默认值。旧配置里 Source 是空串（旧默认），加载时会被 correct 成第一项并写回磁盘——GitHub 必须排在前面，否则所有既有 脚本会被静默改成 Mirror 酱，而它们并没有 CDK，每次运行都更新失败。","options":["GitHub","MirrorChyan"]}}}},"M9AConfig":{"Device":{"kind":"object","ref":"MaaFWConfig.DeviceFields","fields":{"AdbAddress":{"kind":"str","label":"ADB 地址，留空时启动脚本级模拟器获取"},"AdbInputMethods":{"kind":"int","label":"ADB 输入方法，默认优先模拟器增强，失败后回退到 MaaTouch / MiniTouch / ADB 同上，仅第二层适用；第一层运行期写死 InputMethods=18446744073709551607"},"AdbPath":{"kind":"str","label":"ADB 路径，留空时从 MAS 模拟器配置或 MaaFW Toolkit 推导","raw":"FilePath"},"AdbScreencapMethods":{"kind":"int","label":"ADB 截图方法，默认优先模拟器增强，失败后回退到 ADB 截图 仅第二层（MAS 进程内 runner）适用：第一层由外壳自己创建控制器，运行期按 M9A 专项的既验证取值写死（ScreencapMethods=64），本项不参与外部运行， 接线前不要暴露到前端，否则用户改了不会生效也没有提示"},"GamepadType":{"kind":"int","label":"Gamepad 类型，默认 Xbox360"},"HWnd":{"kind":"int","label":"Win32 / Gamepad 窗口句柄，0 表示未指定"},"PlayCoverAddress":{"kind":"str","label":"PlayCover 地址"},"PlayCoverUuid":{"kind":"str","label":"PlayCover UUID"},"Win32KeyboardMethod":{"kind":"int","label":"Win32 键盘方法，0 表示使用 interface 声明或 MaaFW 默认值"},"Win32MouseMethod":{"kind":"int","label":"Win32 鼠标方法，0 表示使用 interface 声明或 MaaFW 默认值"},"Win32ScreencapMethod":{"kind":"int","label":"Win32 截图方法，0 表示使用 interface 声明或 MaaFW 默认值"}}},"Embedded":{"kind":"object","ref":"MaaFWConfig.EmbeddedFields","fields":{"FollowSource":{"kind":"bool","label":"跟随来源目录（开发者模式），默认关。开着时每次运行前比一下来源目录（投影会带走的 文件的路径 + 大小 + 修改时间），变了就重新导入到这个脚本自己的私有渠道（不比版本、 不与同项目其它脚本共用版本），不做项目更新；关掉后回到 Update.Channel 的组。 见 tools/embedded/embedded_project.py「跟随来源目录」一节。"},"ImportedAt":{"kind":"str","label":"导入时间，仅展示；空值表示尚未导入","default":null,"raw":"datetime"},"Report":{"kind":"json","label":"投影报告（省下多少、外壳家族、排除条数与原因），JSON 字符串"},"SourceVersion":{"kind":"str","label":"由 AUTO-MAS 内嵌一份按 interface 白名单投影的副本来运行。副本在 data/mfw/<脚本 uuid 前 12 位>/，由脚本 ID 推出、不进配置、用户不可手改； Info.Path 继续存用户选的来源目录。更新落地时同样只写白名单内的条目。 导入时来源的 interface 版本，仅展示"}}},"Emulator":{"kind":"object","ref":"MaaFWConfig.EmulatorFields","fields":{"Id":{"kind":"str","label":"模拟器 ID，ADB controller 留空地址时使用","raw":"UUID | str"},"Index":{"kind":"str","label":"模拟器索引"}}},"Game":{"kind":"object","ref":"M9AConfig.GameFields","fields":{"Arguments":{"kind":"str","label":"游戏启动参数","raw":"CliArgumentString"},"Hotkeys":{"kind":"json","label":"脚本级键位（PI v2.8 hotkey 选项）：``{option 名: {字段名: 组合键字符串}}``， 组合键写成「修饰键+…+主键」（如 ``\"Ctrl+E\"``）。只存与 interface 默认不同的 字段；运行时叠加到每个任务实际生效的 hotkey 选项上，盖过用户快照 / 预设里的值。 仅 Win32 控制器生效（Adb 等其他控制器不叠加）。interface 里已没有的 option / 字段静默忽略，映射不了的值告警后回落到快照 / 默认值（runner/run_plan.py）。"},"LaunchMode":{"kind":"enum","label":"游戏生命周期模式","options":["DirectExe","AttachOnly"]},"LaunchPath":{"kind":"str","label":"DirectExe 模式下 MAS 启动的游戏 exe","raw":"FilePath"},"PackageName":{"kind":"str","label":"安卓游戏包名，Adb controller 用：启动模拟器时顺带把游戏拉起来。 留空表示从项目的 pipeline 里自动识别（见 embedded/game_package.py）； 自动识别是启发式的，填了这里就以这里为准。识别不出且没填则不启动游戏。"},"UnityResolution":{"kind":"enum","label":"DirectExe 模式下，启动游戏前按 exe 路径反查 Unity 注册表，临时把分辨率改成所选 尺寸的窗口模式，游戏关闭后恢复原值（tools/embedded/game_resolution.py）。 只对 Unity 引擎的游戏有效；游戏已在运行时不改。Off 表示不碰。","options":["Off","1920x1080","1280x720"]},"WaitTime":{"kind":"int","label":"启动等待时间(秒)","default":15}}},"Info":{"kind":"object","ref":"M9AConfig.InfoFields","fields":{"Controller":{"kind":"str","label":"MaaFW controller 名称，留空时按 interface 和设备配置自动选择"},"Name":{"kind":"str","label":"MaaFW 脚本名称"},"Path":{"kind":"str","label":"MaaFW 项目的导入来源目录，应包含 interface.json；导入后可删，删了也原样保留","raw":"NativePath"},"ProjectLabel":{"kind":"str","label":"项目标签，可用于区分同一 ProjectInterface 的不同实例"},"Resource":{"kind":"str","label":"MaaFW resource 名称，留空时选择匹配 controller 的第一个 resource"}}},"Run":{"kind":"object","ref":"M9AConfig.RunFields","fields":{"DailyOnceTasks":{"kind":"str","label":"每天正常完成一次后，当天剩余时间跳过的 MaaFW 任务名列表","raw":"JsonListString"},"GameUpdateMode":{"kind":"enum","label":"游戏客户端更新：Off 不检查 / Check 只检查，落后时本次判失败并提示手动更新 / AutoInstall 落后时自动下载安装包并 adb 安装（保留游戏数据）。只在特调实现了 游戏更新钩子（当前只有 M9A）且 controller 是 ADB 时生效，通用 MaaFW 不读。 Off 必须排第一：OptionsValidator 纠错回退的是 options[0]。","options":["Off","Check","AutoInstall"]},"LoopGuard":{"kind":"bool","label":"原地打转检测（实验性，默认关）。任务在短周期里反复执行同一串节点（周期 ≤ 8 步、每轮都有点击 / 滑动等物理动作）、识别结果又几乎不变时判定卡死：≥ 200 轮且持续 ≥ 10 分钟就停掉这个任务，收尾与单任务超时同一口径（截图、第一个任务或关键任务 结束本轮，其余记失败后继续）。判据见 tools/core/runner/loop_guard.py。"},"MonthlyOnceTasks":{"kind":"str","label":"每月正常完成一次后，本月剩余时间跳过的 MaaFW 任务名列表","raw":"JsonListString"},"ProxyTimesLimit":{"kind":"int","label":"运行引擎，决定「谁来跑」： 代理次数限制"},"RunTimeLimit":{"kind":"int","label":"单次运行时间限制（分钟），套在单个用户的整次运行上。截止时刻随 job 文件交给 worker：到点它自己停掉当前任务、截一张超时图、带回已完成的任务；宿主只在 worker 没能及时停下时才强杀（那时既没有截图也没有进度）。MaaFW 项目一轮日常 动辄几十分钟，30 分钟默认值实测常被误伤，放宽到 120。"},"RunTimesLimit":{"kind":"int","label":"运行次数限制。重试不关游戏、不再等启动，从当前画面接着跑； 脚本自己的加载超时（MaaEnd 回大世界 20s）一次抖动就把整轮判失败， 只给一次机会时用户看到的就是「从来没成功过」，默认与其他专项一样 3 次。"},"TaskTimeLimit":{"kind":"int","label":"单个任务的时限（分钟），0 表示不限。某个任务卡住时到点只停它、截一张超时图， 记一条任务失败后接着跑后面的任务（计划里第一个任务超时则结束本轮）；不再让 一个卡住的任务吃掉整轮 RunTimeLimit 的时间。 默认 45 而不是 30：M9A 智能均衡刷材料正常 1–22 分钟，自动深眠在新内容日 实测 33.7 分钟，30 会误伤正常运行。"},"TaskTimeLimitOverrides":{"kind":"json","label":"按任务名覆盖的单任务时限（分钟），键是 MaaFW 任务名；值 0 表示该任务不限。 默认值由类属性 DEFAULT_TASK_TIME_LIMIT_OVERRIDES 决定（特调可内置几条）； 只在配置里没有这个键时生效，用户存过的值（含清空成 {}）原样保留。"},"WeeklyOnceTasks":{"kind":"str","label":"每周正常完成一次后，本周剩余时间跳过的 MaaFW 任务名列表","raw":"JsonListString"}}},"Selection":{"kind":"object","ref":"MaaFWConfig.SelectionFields","fields":{"Controller":{"kind":"str","label":"当前阶段保留：manager.py 仍从 Selection.* 读取运行范围， 字段迁移到 Info.* / 用户任务配置属于后续 P3 前端回收。 选中的 controller 列表","raw":"JsonListString"},"Resource":{"kind":"str","label":"选中的 resource 列表","raw":"JsonListString"},"Tasks":{"kind":"str","label":"选中的 task 列表","raw":"JsonListString"}}},"Task":{"kind":"object","ref":"MaaFWConfig.TaskFields","fields":{"Templates":{"kind":"str","label":"用户页任务队列的自定义模板，同一脚本的用户共用。JSON 列表，每项 ``{\"name\": 模板名, \"snapshot\": {taskOrder, taskChecked, taskOptions, taskLabels?}}``， 快照形状同用户的 Task.TaskSnapshot（键是任务实例 id），但不含受管任务、密码字段 与全局选项（globalOptions 归各用户自己）； 名称在脚本内唯一。运行流程不读它，只由用户页套用到某个用户的队列。","raw":"JsonListString"}}},"Update":{"kind":"object","ref":"MaaFWConfig.UpdateFields","fields":{"AutoUpdateMode":{"kind":"enum","label":"项目自动更新时机：Off 不更新 / BeforeRun 运行前 / AfterRun 全部用户跑完后。 由 embedded_manager 在用户任务之外执行，耗时不计入 Run.RunTimeLimit。","options":["Off","BeforeRun","AfterRun"]},"Channel":{"kind":"enum","label":"更新渠道只有稳定版与测试版，默认稳定版，要测试版由用户手动切。 不给「跟随全局」：全局那个 Update.Channel 是 MAS 自身的发布通道， 和脚本本体的版本档位是两回事，串在一起只会让人猜。 Mirror 酱还支持 channel=alpha，**故意不开放**——那是项目方的内部 验证档，稳定性无保证，而这里更新的是用户日常在跑的脚本本体。 这两个值必须与前端 updateChannelOptions 和 schema 的 Literal 一致： 三处任一多给一档，用户选了就会 422 或被静默纠回默认值。 旧配置里的空串现在是非法值，会被 correct() 回退成 options[0]， 即 stable——这里的顺序同样不能随意调换。","options":["stable","beta"]},"GitHubAssetPattern":{"kind":"str","label":"[已废弃] GitHub release asset 文件名匹配模式"},"GitHubRepo":{"kind":"str","label":"[已废弃] GitHub 仓库/tag/asset 覆盖：仓库与资产名改为从 interface.json 和目录名自动推导，运行流程不再读取；保留一个版本兼容旧配置文件后删除。"},"GitHubTag":{"kind":"str","label":"[已废弃] GitHub release tag 覆盖"},"IfAutoUpdate":{"kind":"bool","label":"[已废弃] 旧布尔开关，只在 load() 里迁移为 AutoUpdateMode（False → Off）， 运行流程不再读取；保留一个版本兼容旧配置文件后删除。"},"MirrorChyanCDK":{"kind":"str","label":"Mirror 酱 CDK，由用户自己填。**不做全局兜底**：全局那个服务的是 AUTO-MAS 自身的更新，和脚本本体不是一回事，串在一起只会让人猜 自己在用哪个。选 Mirror 酱作为下载源时这一项必填。 （合并逻辑见 tools/embedded/update_credentials.py）"},"ProxyAddress":{"kind":"str","label":"脚本级网络代理，给这个项目的更新包下载与运行环境安装（uv / pip、 binding 源码兜底）用。与 CDK / 渠道不同，这一项**留空就跟随全局** `Update.ProxyAddress`（设置 → 其他 → 网络代理），填了就只走自己的： 代理解决的是「这台机器连不连得上」，多数人全局一份就够，个别项目 的源在别的网络才需要单独指。格式同全局项，`host:port` 不带协议时 补 `http://`（合并逻辑见 tools/embedded/update_credentials.py）。"},"Source":{"kind":"enum","label":"更新包的下载源，由用户显式选择——**不做自动分流**。 版本检查始终走 Mirror 酱（无 CDK 也能查），但下载去哪由这一项决定： 选 Mirror 酱就必须自己填 CDK，CDK 不可用时明确报错，不悄悄换成 GitHub——用户得知道自己在从哪下载，出问题才查得动。 默认 GitHub：零配置即可用，与全局 Update.Source 的默认值一致。 选项顺序有意义：OptionsValidator.correct() 回退的是 **options[0]**， 不是这里的默认值。旧配置里 Source 是空串（旧默认），加载时会被 correct 成第一项并写回磁盘——GitHub 必须排在前面，否则所有既有 脚本会被静默改成 Mirror 酱，而它们并没有 CDK，每次运行都更新失败。","options":["GitHub","MirrorChyan"]}}}},"MSSConfig":{"Device":{"kind":"object","ref":"MaaFWConfig.DeviceFields","fields":{"AdbAddress":{"kind":"str","label":"ADB 地址，留空时启动脚本级模拟器获取"},"AdbInputMethods":{"kind":"int","label":"ADB 输入方法，默认优先模拟器增强，失败后回退到 MaaTouch / MiniTouch / ADB 同上，仅第二层适用；第一层运行期写死 InputMethods=18446744073709551607"},"AdbPath":{"kind":"str","label":"ADB 路径，留空时从 MAS 模拟器配置或 MaaFW Toolkit 推导","raw":"FilePath"},"AdbScreencapMethods":{"kind":"int","label":"ADB 截图方法，默认优先模拟器增强，失败后回退到 ADB 截图 仅第二层（MAS 进程内 runner）适用：第一层由外壳自己创建控制器，运行期按 M9A 专项的既验证取值写死（ScreencapMethods=64），本项不参与外部运行， 接线前不要暴露到前端，否则用户改了不会生效也没有提示"},"GamepadType":{"kind":"int","label":"Gamepad 类型，默认 Xbox360"},"HWnd":{"kind":"int","label":"Win32 / Gamepad 窗口句柄，0 表示未指定"},"PlayCoverAddress":{"kind":"str","label":"PlayCover 地址"},"PlayCoverUuid":{"kind":"str","label":"PlayCover UUID"},"Win32KeyboardMethod":{"kind":"int","label":"Win32 键盘方法，0 表示使用 interface 声明或 MaaFW 默认值"},"Win32MouseMethod":{"kind":"int","label":"Win32 鼠标方法，0 表示使用 interface 声明或 MaaFW 默认值"},"Win32ScreencapMethod":{"kind":"int","label":"Win32 截图方法，0 表示使用 interface 声明或 MaaFW 默认值"}}},"Embedded":{"kind":"object","ref":"MaaFWConfig.EmbeddedFields","fields":{"FollowSource":{"kind":"bool","label":"跟随来源目录（开发者模式），默认关。开着时每次运行前比一下来源目录（投影会带走的 文件的路径 + 大小 + 修改时间），变了就重新导入到这个脚本自己的私有渠道（不比版本、 不与同项目其它脚本共用版本），不做项目更新；关掉后回到 Update.Channel 的组。 见 tools/embedded/embedded_project.py「跟随来源目录」一节。"},"ImportedAt":{"kind":"str","label":"导入时间，仅展示；空值表示尚未导入","default":null,"raw":"datetime"},"Report":{"kind":"json","label":"投影报告（省下多少、外壳家族、排除条数与原因），JSON 字符串"},"SourceVersion":{"kind":"str","label":"由 AUTO-MAS 内嵌一份按 interface 白名单投影的副本来运行。副本在 data/mfw/<脚本 uuid 前 12 位>/，由脚本 ID 推出、不进配置、用户不可手改； Info.Path 继续存用户选的来源目录。更新落地时同样只写白名单内的条目。 导入时来源的 interface 版本，仅展示"}}},"Emulator":{"kind":"object","ref":"MaaFWConfig.EmulatorFields","fields":{"Id":{"kind":"str","label":"模拟器 ID，ADB controller 留空地址时使用","raw":"UUID | str"},"Index":{"kind":"str","label":"模拟器索引"}}},"Game":{"kind":"object","ref":"MaaFWConfig.GameFields","fields":{"Arguments":{"kind":"str","label":"游戏启动参数","raw":"CliArgumentString"},"Hotkeys":{"kind":"json","label":"脚本级键位（PI v2.8 hotkey 选项）：``{option 名: {字段名: 组合键字符串}}``， 组合键写成「修饰键+…+主键」（如 ``\"Ctrl+E\"``）。只存与 interface 默认不同的 字段；运行时叠加到每个任务实际生效的 hotkey 选项上，盖过用户快照 / 预设里的值。 仅 Win32 控制器生效（Adb 等其他控制器不叠加）。interface 里已没有的 option / 字段静默忽略，映射不了的值告警后回落到快照 / 默认值（runner/run_plan.py）。"},"LaunchMode":{"kind":"enum","label":"游戏生命周期模式","options":["DirectExe","AttachOnly"]},"LaunchPath":{"kind":"str","label":"DirectExe 模式下 MAS 启动的游戏 exe","raw":"FilePath"},"PackageName":{"kind":"str","label":"安卓游戏包名，Adb controller 用：启动模拟器时顺带把游戏拉起来。 留空表示从项目的 pipeline 里自动识别（见 embedded/game_package.py）； 自动识别是启发式的，填了这里就以这里为准。识别不出且没填则不启动游戏。"},"UnityResolution":{"kind":"enum","label":"DirectExe 模式下，启动游戏前按 exe 路径反查 Unity 注册表，临时把分辨率改成所选 尺寸的窗口模式，游戏关闭后恢复原值（tools/embedded/game_resolution.py）。 只对 Unity 引擎的游戏有效；游戏已在运行时不改。Off 表示不碰。","options":["Off","1920x1080","1280x720"]},"WaitTime":{"kind":"int","label":"游戏启动等待时间（秒）：既是等窗口出现的上限，也是窗口出现后等画面稳定的上限。 Unity 游戏窗口出现时还在黑屏加载，登录界面往往要二三十秒后才渲染出来； MaaEnd 的 SceneManager 见连续画面不变十几秒就判「环境识别异常」直接失败。 等画面时 worker 每秒截一帧，有内容且连续几秒不变就提前下发，等不到才等满； MaaFW 初始化（加载资源、连 controller、起 agent）与之重叠而不是干等。 只对本轮由 MAS 拉起的游戏生效，AttachOnly 与「游戏已在运行」不等画面。"}}},"Info":{"kind":"object","ref":"MSSConfig.InfoFields","fields":{"Controller":{"kind":"str","label":"MaaFW controller 名称，留空时按 interface 和设备配置自动选择"},"Name":{"kind":"str","label":"MaaFW 脚本名称"},"Path":{"kind":"str","label":"MaaFW 项目的导入来源目录，应包含 interface.json；导入后可删，删了也原样保留","raw":"NativePath"},"ProjectLabel":{"kind":"str","label":"项目标签，可用于区分同一 ProjectInterface 的不同实例"},"Resource":{"kind":"str","label":"MaaFW resource 名称，留空时选择匹配 controller 的第一个 resource"}}},"Run":{"kind":"object","ref":"MaaFWConfig.RunFields","fields":{"DailyOnceTasks":{"kind":"str","label":"每天正常完成一次后，当天剩余时间跳过的 MaaFW 任务名列表","raw":"JsonListString"},"GameUpdateMode":{"kind":"enum","label":"游戏客户端更新：Off 不检查 / Check 只检查，落后时本次判失败并提示手动更新 / AutoInstall 落后时自动下载安装包并 adb 安装（保留游戏数据）。只在特调实现了 游戏更新钩子（当前只有 M9A）且 controller 是 ADB 时生效，通用 MaaFW 不读。 Off 必须排第一：OptionsValidator 纠错回退的是 options[0]。","options":["Off","Check","AutoInstall"]},"LoopGuard":{"kind":"bool","label":"原地打转检测（实验性，默认关）。任务在短周期里反复执行同一串节点（周期 ≤ 8 步、每轮都有点击 / 滑动等物理动作）、识别结果又几乎不变时判定卡死：≥ 200 轮且持续 ≥ 10 分钟就停掉这个任务，收尾与单任务超时同一口径（截图、第一个任务或关键任务 结束本轮，其余记失败后继续）。判据见 tools/core/runner/loop_guard.py。"},"MonthlyOnceTasks":{"kind":"str","label":"每月正常完成一次后，本月剩余时间跳过的 MaaFW 任务名列表","raw":"JsonListString"},"ProxyTimesLimit":{"kind":"int","label":"运行引擎，决定「谁来跑」： 代理次数限制"},"RunTimeLimit":{"kind":"int","label":"单次运行时间限制（分钟），套在单个用户的整次运行上。截止时刻随 job 文件交给 worker：到点它自己停掉当前任务、截一张超时图、带回已完成的任务；宿主只在 worker 没能及时停下时才强杀（那时既没有截图也没有进度）。MaaFW 项目一轮日常 动辄几十分钟，30 分钟默认值实测常被误伤，放宽到 120。"},"RunTimesLimit":{"kind":"int","label":"运行次数限制。重试不关游戏、不再等启动，从当前画面接着跑； 脚本自己的加载超时（MaaEnd 回大世界 20s）一次抖动就把整轮判失败， 只给一次机会时用户看到的就是「从来没成功过」，默认与其他专项一样 3 次。"},"TaskTimeLimit":{"kind":"int","label":"单个任务的时限（分钟），0 表示不限。某个任务卡住时到点只停它、截一张超时图， 记一条任务失败后接着跑后面的任务（计划里第一个任务超时则结束本轮）；不再让 一个卡住的任务吃掉整轮 RunTimeLimit 的时间。 默认 45 而不是 30：M9A 智能均衡刷材料正常 1–22 分钟，自动深眠在新内容日 实测 33.7 分钟，30 会误伤正常运行。"},"TaskTimeLimitOverrides":{"kind":"json","label":"按任务名覆盖的单任务时限（分钟），键是 MaaFW 任务名；值 0 表示该任务不限。 默认值由类属性 DEFAULT_TASK_TIME_LIMIT_OVERRIDES 决定（特调可内置几条）； 只在配置里没有这个键时生效，用户存过的值（含清空成 {}）原样保留。"},"WeeklyOnceTasks":{"kind":"str","label":"每周正常完成一次后，本周剩余时间跳过的 MaaFW 任务名列表","raw":"JsonListString"}}},"Selection":{"kind":"object","ref":"MaaFWConfig.SelectionFields","fields":{"Controller":{"kind":"str","label":"当前阶段保留：manager.py 仍从 Selection.* 读取运行范围， 字段迁移到 Info.* / 用户任务配置属于后续 P3 前端回收。 选中的 controller 列表","raw":"JsonListString"},"Resource":{"kind":"str","label":"选中的 resource 列表","raw":"JsonListString"},"Tasks":{"kind":"str","label":"选中的 task 列表","raw":"JsonListString"}}},"Task":{"kind":"object","ref":"MaaFWConfig.TaskFields","fields":{"Templates":{"kind":"str","label":"用户页任务队列的自定义模板，同一脚本的用户共用。JSON 列表，每项 ``{\"name\": 模板名, \"snapshot\": {taskOrder, taskChecked, taskOptions, taskLabels?}}``， 快照形状同用户的 Task.TaskSnapshot（键是任务实例 id），但不含受管任务、密码字段 与全局选项（globalOptions 归各用户自己）； 名称在脚本内唯一。运行流程不读它，只由用户页套用到某个用户的队列。","raw":"JsonListString"}}},"Update":{"kind":"object","ref":"MaaFWConfig.UpdateFields","fields":{"AutoUpdateMode":{"kind":"enum","label":"项目自动更新时机：Off 不更新 / BeforeRun 运行前 / AfterRun 全部用户跑完后。 由 embedded_manager 在用户任务之外执行，耗时不计入 Run.RunTimeLimit。","options":["Off","BeforeRun","AfterRun"]},"Channel":{"kind":"enum","label":"更新渠道只有稳定版与测试版，默认稳定版，要测试版由用户手动切。 不给「跟随全局」：全局那个 Update.Channel 是 MAS 自身的发布通道， 和脚本本体的版本档位是两回事，串在一起只会让人猜。 Mirror 酱还支持 channel=alpha，**故意不开放**——那是项目方的内部 验证档，稳定性无保证，而这里更新的是用户日常在跑的脚本本体。 这两个值必须与前端 updateChannelOptions 和 schema 的 Literal 一致： 三处任一多给一档，用户选了就会 422 或被静默纠回默认值。 旧配置里的空串现在是非法值，会被 correct() 回退成 options[0]， 即 stable——这里的顺序同样不能随意调换。","options":["stable","beta"]},"GitHubAssetPattern":{"kind":"str","label":"[已废弃] GitHub release asset 文件名匹配模式"},"GitHubRepo":{"kind":"str","label":"[已废弃] GitHub 仓库/tag/asset 覆盖：仓库与资产名改为从 interface.json 和目录名自动推导，运行流程不再读取；保留一个版本兼容旧配置文件后删除。"},"GitHubTag":{"kind":"str","label":"[已废弃] GitHub release tag 覆盖"},"IfAutoUpdate":{"kind":"bool","label":"[已废弃] 旧布尔开关，只在 load() 里迁移为 AutoUpdateMode（False → Off）， 运行流程不再读取；保留一个版本兼容旧配置文件后删除。"},"MirrorChyanCDK":{"kind":"str","label":"Mirror 酱 CDK，由用户自己填。**不做全局兜底**：全局那个服务的是 AUTO-MAS 自身的更新，和脚本本体不是一回事，串在一起只会让人猜 自己在用哪个。选 Mirror 酱作为下载源时这一项必填。 （合并逻辑见 tools/embedded/update_credentials.py）"},"ProxyAddress":{"kind":"str","label":"脚本级网络代理，给这个项目的更新包下载与运行环境安装（uv / pip、 binding 源码兜底）用。与 CDK / 渠道不同，这一项**留空就跟随全局** `Update.ProxyAddress`（设置 → 其他 → 网络代理），填了就只走自己的： 代理解决的是「这台机器连不连得上」，多数人全局一份就够，个别项目 的源在别的网络才需要单独指。格式同全局项，`host:port` 不带协议时 补 `http://`（合并逻辑见 tools/embedded/update_credentials.py）。"},"Source":{"kind":"enum","label":"更新包的下载源，由用户显式选择——**不做自动分流**。 版本检查始终走 Mirror 酱（无 CDK 也能查），但下载去哪由这一项决定： 选 Mirror 酱就必须自己填 CDK，CDK 不可用时明确报错，不悄悄换成 GitHub——用户得知道自己在从哪下载，出问题才查得动。 默认 GitHub：零配置即可用，与全局 Update.Source 的默认值一致。 选项顺序有意义：OptionsValidator.correct() 回退的是 **options[0]**， 不是这里的默认值。旧配置里 Source 是空串（旧默认），加载时会被 correct 成第一项并写回磁盘——GitHub 必须排在前面，否则所有既有 脚本会被静默改成 Mirror 酱，而它们并没有 CDK，每次运行都更新失败。","options":["GitHub","MirrorChyan"]}}}},"GeneralConfig":{"Game":{"kind":"object","ref":"GeneralConfig.GameFields","fields":{"Arguments":{"kind":"str","label":"游戏启动参数","raw":"CliArgumentString"},"EmulatorId":{"kind":"str","label":"模拟器 ID","raw":"UUID | str"},"EmulatorIndex":{"kind":"str","label":"模拟器索引"},"Enabled":{"kind":"bool","label":"是否启用游戏"},"IfForceClose":{"kind":"bool","label":"是否强制关闭"},"Path":{"kind":"str","label":"游戏路径","raw":"FilePath"},"ProcessName":{"kind":"str","label":"游戏进程名称"},"Type":{"kind":"enum","label":"游戏类型","options":["Emulator","Client","URL"]},"URL":{"kind":"str","label":"自定义协议URL"},"WaitTime":{"kind":"int","label":"等待时间（秒）"}}},"Info":{"kind":"object","ref":"GeneralConfig.InfoFields","fields":{"Name":{"kind":"str","label":"脚本名称"},"RootPath":{"kind":"str","label":"根目录路径","raw":"FolderPath"}}},"Run":{"kind":"object","ref":"GeneralConfig.RunFields","fields":{"HardTimeLimit":{"kind":"int","label":"单账号运行总时限（分钟），包含等待和全部重试"},"ProxyTimesLimit":{"kind":"int","label":"代理次数限制"},"RunTimeLimit":{"kind":"int","label":"运行时间限制（分钟）"},"RunTimesLimit":{"kind":"int","label":"运行次数限制"}}},"Script":{"kind":"object","ref":"GeneralConfig.ScriptFields","fields":{"Arguments":{"kind":"str","label":"脚本参数","raw":"CliArgumentListString"},"ConfigPath":{"kind":"str","label":"配置文件路径","raw":"NativePath"},"ConfigPathMode":{"kind":"enum","label":"配置路径模式","options":["File","Folder"]},"ErrorLog":{"kind":"str","label":"错误日志匹配"},"ErrorLogMode":{"kind":"enum","label":"错误日志匹配模式：Split = 「|」分隔关键字子串包含；Regex = 正则表达式","options":["Split","Regex"]},"IfTrackProcess":{"kind":"bool","label":"是否追踪进程"},"LogHookEnabled":{"kind":"bool","label":"日志预处理启用开关：关闭时保留规则配置，行为与未配置预处理完全一致"},"LogHookRules":{"kind":"str","label":"日志预处理规则（JSON 数组，每项形如 {\"type\":\"drop|replace\",...}）； 预处理先于任务日志、推送日志采集与成功/失败判定执行，丢弃的行不进入下游"},"LogPath":{"kind":"str","label":"日志路径","raw":"NativePath"},"LogPathFormat":{"kind":"str","label":"日志路径格式"},"LogTimeEnd":{"kind":"int","label":"日志时间戳结束位置"},"LogTimeFormat":{"kind":"str","label":"日志时间格式"},"LogTimeStart":{"kind":"int","label":"日志时间戳开始位置"},"PushLogEnabled":{"kind":"bool","label":"推送日志启用开关：关闭后保留高级正则配置，但不会实际采集推送日志"},"PushLogPatterns":{"kind":"str","label":"推送日志高级模式（JSON 数组，每项形如 {\"type\":\"regex|multiline\",...}）"},"ScriptPath":{"kind":"str","label":"脚本路径","raw":"NativePath"},"SuccessLog":{"kind":"str","label":"成功日志匹配"},"SuccessLogMode":{"kind":"enum","label":"成功日志匹配模式：Split = 「|」分隔关键字子串包含；Regex = 正则表达式","options":["Split","Regex"]},"TrackProcessCmdline":{"kind":"str","label":"追踪进程的启动命令行参数","raw":"CliArgumentString"},"TrackProcessExe":{"kind":"str","label":"追踪进程的文件路径"},"TrackProcessName":{"kind":"str","label":"追踪进程的名称"},"UpdateConfigMode":{"kind":"enum","label":"更新配置模式","options":["Never","Success","Failure","Always"]}}}},"OkwwConfig":{"Game":{"kind":"object","ref":"OkwwConfig.GameFields","fields":{"AccountSwitch":{"kind":"bool","label":"运行前强制切换账号（依赖游戏配置启用；用户未填手机号时不切换）"},"Arguments":{"kind":"str","label":"鸣潮启动参数（直启时 MAS 会额外内置 -krqlv=hd，与本参数并存）","raw":"CliArgumentString"},"ClientPath":{"kind":"str","label":"直启模式下手动指定的客户端程序路径（留空则由启动器路径自动定位）","raw":"FilePath"},"Enabled":{"kind":"bool","label":"是否由 MAS 管理游戏进程"},"IfAutoUpdate":{"kind":"bool","label":"任务前是否由 MAS 检查并接管更新游戏"},"Path":{"kind":"str","label":"鸣潮官方启动器路径（两种启动方式均由它定位游戏安装目录）","raw":"FilePath"},"Type":{"kind":"enum","label":"游戏启动方式：Client=直启客户端（内置 -krqlv=hd），Launcher=经官方启动器 默认值必须排首位：值非法时 correct() 回落到 options[0]","options":["Client","Launcher"]},"UpdateFullSyncLimit":{"kind":"int","label":"整文件同步体积上限（GB），超过则中止并提示手动处理"},"WaitTime":{"kind":"int","label":"等待游戏启动时间"}}},"Info":{"kind":"object","ref":"OkwwConfig.InfoFields","fields":{"Name":{"kind":"str","label":"脚本名称"},"RootPath":{"kind":"str","label":"OK-WW 脚本根目录","raw":"FolderPath"}}},"Run":{"kind":"object","ref":"OkwwConfig.RunFields","fields":{"HardTimeLimit":{"kind":"int","label":"单账号运行总时限（分钟），包含等待和全部重试"},"ProxyTimesLimit":{"kind":"int","label":"每日代理次数上限"},"RunTimeLimit":{"kind":"int","label":"单次运行超时时间"},"RunTimesLimit":{"kind":"int","label":"单次任务重试次数"}}}},"OkNteConfig":{"Game":{"kind":"object","ref":"OkNteConfig.GameFields","fields":{"AccountSwitch":{"kind":"bool","label":"运行前强制切换账号（依赖游戏配置启用；用户未填手机号时不切换）"},"Arguments":{"kind":"str","label":"游戏启动参数","raw":"CliArgumentString"},"CloseOnFinish":{"kind":"bool","label":"任务结束后是否关闭游戏"},"Enabled":{"kind":"bool","label":"游戏相关功能是否启用"},"IfForceClose":{"kind":"bool","label":"是否强制关闭游戏进程"},"LaunchBeforeTask":{"kind":"bool","label":"任务开始前是否由 MAS 启动游戏"},"LaunchMode":{"kind":"enum","label":"静默启动（Autoplay）= 启动器带 /autoplay 拉起，不点按钮；启动器界面启动 （LauncherUi）= 打开启动器界面，由 OCR 点「开始游戏」及其弹窗/更新分支。 默认值双轨：新建脚本取类默认 Autoplay；存量脚本（配置无该键）由 load 迁移 固化升级前的 LauncherUi（见 _migrate_oknte_launch_mode_default），保持升级前行为。","options":["Autoplay","LauncherUi"]},"Path":{"kind":"str","label":"异环直启 HTGame.exe 会卡界面，此路径为启动器 exe（NTELauncher/NTEGame.exe）， 旧值为 HTGame.exe 时运行时自动反推同安装根下的启动器","raw":"FilePath"},"ProcessName":{"kind":"str","label":"游戏进程名称"},"Type":{"kind":"enum","label":"类型: PC端, URL协议","options":["Client","URL"]},"URL":{"kind":"str","label":"自定义协议URL"},"WaitTime":{"kind":"int","label":"游戏等待启动时间"}}},"Info":{"kind":"object","ref":"OkNteConfig.InfoFields","fields":{"Name":{"kind":"str","label":"脚本名称"},"RootPath":{"kind":"str","label":"脚本根目录","raw":"FolderPath"}}},"Run":{"kind":"object","ref":"OkNteConfig.RunFields","fields":{"HardTimeLimit":{"kind":"int","label":"单账号运行总时限（分钟），包含等待和全部重试"},"ProxyTimesLimit":{"kind":"int","label":"每日代理次数限制"},"RunTimeLimit":{"kind":"int","label":"日志超时限制"},"RunTimesLimit":{"kind":"int","label":"重试次数限制"}}},"Script":{"kind":"object","ref":"OkNteConfig.ScriptFields","fields":{"Arguments":{"kind":"str","label":"OkNte 运行参数建议由用户配置（-t / -e 由用户配置 Task 决定），但仍保留高级参数入口","raw":"CliArgumentListString"},"ConfigPath":{"kind":"str","label":"配置文件路径","raw":"NativePath"},"ConfigPathMode":{"kind":"enum","label":"配置文件类型: 单个文件, 文件夹","options":["File","Folder"]},"ErrorLog":{"kind":"str","label":"错误时日志"},"ErrorLogMode":{"kind":"enum","label":"错误时日志匹配模式: 关键字子串包含, 正则表达式","options":["Split","Regex"]},"IfTrackProcess":{"kind":"bool","label":"是否追踪脚本子进程"},"LogPath":{"kind":"str","label":"日志文件路径","raw":"NativePath"},"LogPathFormat":{"kind":"str","label":"日志文件名格式"},"LogTimeEnd":{"kind":"int","label":"日志时间戳结束位置"},"LogTimeFormat":{"kind":"str","label":"日志时间戳格式"},"LogTimeStart":{"kind":"int","label":"日志时间戳开始位置"},"ScriptPath":{"kind":"str","label":"脚本可执行文件路径","raw":"FilePath"},"SuccessLog":{"kind":"str","label":"成功时日志"},"SuccessLogMode":{"kind":"enum","label":"成功时日志匹配模式: 关键字子串包含, 正则表达式","options":["Split","Regex"]},"TrackProcessCmdline":{"kind":"str","label":"追踪进程启动命令行参数","raw":"CliArgumentString"},"TrackProcessExe":{"kind":"str","label":"追踪进程文件路径"},"TrackProcessName":{"kind":"str","label":"追踪进程名称"},"UpdateConfigMode":{"kind":"enum","label":"更新配置时机, 从不, 仅成功时, 仅失败时, 任务结束时","options":["Never","Success","Failure","Always"]}}}},"BetterGIConfig":{"Game":{"kind":"object","ref":"BetterGIConfig.GameFields","fields":{"CloseOnFinish":{"kind":"bool","label":"任务结束后关闭游戏"},"Controller":{"kind":"enum","label":"控制器（游戏控制方式：电脑端-前台 / 电脑端-云原神 / 电脑端-桌面分身） ⚠️ 预留字段：当前运行时不读取（BetterGI 自行管理游戏控制），云原神 / 桌面分身 尚未开发。为将来支持而保留占位并持久化，恒为默认「电脑端-前台」，勿被判定死代码误删。","options":["电脑端-前台","电脑端-云原神","电脑端-桌面分身"]},"IfAutoUpdate":{"kind":"bool","label":"是否在启动 BetterGI 前由 MAS 检查并接管原神客户端更新"}}},"Info":{"kind":"object","ref":"BetterGIConfig.InfoFields","fields":{"Name":{"kind":"str","label":"脚本名称"},"RootPath":{"kind":"str","label":"脚本根目录","raw":"FolderPath"}}},"Run":{"kind":"object","ref":"BetterGIConfig.RunFields","fields":{"AccountSwitchMethod":{"kind":"enum","label":"账号切换方式（脚本级，参考 MaaEnd Run.AccountSwitchMethod）： BGI = BetterGI「切换账号多模式」脚本执行（国际服请改用此方式）；MAS = MAS 侧 前台 OCR 直接操控游戏切号（官服/B服，游戏由 MAS 托管启动），官服/B服推荐。 默认值双轨：新建脚本取类默认 MAS；存量脚本（配置无该键）由 load 迁移固化 旧默认 BGI（见 _migrate_bgi_account_switch_default），保持升级前行为。","options":["BGI","MAS"]},"HardTimeLimit":{"kind":"int","label":"单账号运行总时限（分钟），包含等待和全部重试"},"ProxyTimesLimit":{"kind":"int","label":"每日代理次数限制"},"RunTimeLimit":{"kind":"int","label":"日志超时限制"},"RunTimesLimit":{"kind":"int","label":"重试次数限制"},"UseAdmin":{"kind":"bool","label":"是否以管理员权限启动 BetterGI。默认提权（贴近旧行为）；若 MAS 平时以非管理员 运行、又不希望每次启动 BGI 都弹 UAC（无人值守任务尤其容易挂在授权上），可关闭。 MAS 自身已提权时，即使此处开启，也不会重复触发 UAC（子进程自动继承管理员令牌）。"}}}},"ZzzOdConfig":{"Game":{"kind":"object","ref":"ZzzOdConfig.GameFields","fields":{"AccountSwitch":{"kind":"enum","label":"多用户账号切换方式（脚本级下拉，value 对应 manager 的分派分支）： 单实例切换（默认，推荐）= 逐用户独立会话：注入该用户配置 → 单实例 运行（仅运行当前，无槽间切换）→ 跑完关闭 → 下一个用户。失败域 隔离最好，重试只重启失败用户； 多实例切换（不推荐）= 全部启用用户合并为一轮多账号运行，一条龙内部 依次切换账号。总时长最短，但单槽失败会拖整轮重试、切换次数随 用户数线性增长； MAS切换 = MAS 侧 OCR 操控游戏完成账号切换后交一条龙运行（暂未开放）。","options":["单实例切换","多实例切换","MAS切换"]},"Arguments":{"kind":"str","label":"游戏启动参数","raw":"CliArgumentString"},"CloseOnFinish":{"kind":"bool","label":"任务结束后由 MAS 关闭游戏（收尾/手动停止时按进程名结束游戏本体， 覆盖失败重试与手动停止场景，是「结束后操作」的兜底）。与用户级 OneDragon.AfterDone 下发的 --close-game 相互独立，同时配置会各 执行一次（无害）"},"Enabled":{"kind":"bool","label":"是否由 MAS 管理游戏进程（任务前启动游戏由此开关总控）"},"LaunchBeforeTask":{"kind":"bool","label":"任务前由 MAS 启动游戏（检测到游戏进程正在运行时跳过重复启动）"},"Path":{"kind":"str","label":"游戏路径（游戏本体 ZenlessZoneZero.exe）","raw":"FilePath"},"WaitTime":{"kind":"int","label":"启动游戏后的等待时间（秒）"}}},"Info":{"kind":"object","ref":"ZzzOdConfig.InfoFields","fields":{"Name":{"kind":"str","label":"脚本名称"},"RootPath":{"kind":"str","label":"zzz-od 安装根目录（含 OneDragon 启动器、src 与 config）","raw":"FolderPath"}}},"Run":{"kind":"object","ref":"ZzzOdConfig.RunFields","fields":{"HardTimeLimit":{"kind":"int","label":"单账号运行总时限（分钟），包含等待和全部重试"},"ProxyTimesLimit":{"kind":"int","label":"每日代理次数上限"},"RunTimeLimit":{"kind":"int","label":"单次运行超时时间（分钟）；这是日志停滞超时（latest_time 距今），不是 总时长上限——一条龙持续写日志就不会触发；启动器层故障（不写应用层 日志）也靠它兜底超时后切换启动器"},"RunTimesLimit":{"kind":"int","label":"单次任务重试次数"}}}},"BAAHConfig":{"Emulator":{"kind":"object","ref":"BAAHConfig.EmulatorFields","fields":{"Id":{"kind":"str","label":"模拟器 ID","raw":"UUID | str"},"Index":{"kind":"str","label":"模拟器索引"}}},"Info":{"kind":"object","ref":"BAAHConfig.InfoFields","fields":{"Name":{"kind":"str","label":"脚本名称"}}},"Run":{"kind":"object","ref":"BAAHConfig.RunFields","fields":{"HardTimeLimit":{"kind":"int","label":"单账号运行总时限（分钟），包含等待和全部重试"},"RunTimeLimit":{"kind":"int","label":"运行时间限制（分钟）"},"RunTimesLimit":{"kind":"int","label":"运行次数限制"}}},"Script":{"kind":"object","ref":"BAAHConfig.ScriptFields","fields":{"BAAHPath":{"kind":"str","label":"BAAH 主程序路径；程序目录、配置目录与日志目录都从它派生","raw":"FilePath"},"IfManageConfig":{"kind":"bool","label":"是否由本软件托管运行所需的关键配置项"},"PushLogEnabled":{"kind":"bool","label":"是否在任务报告中展示 BAAH 的任务节点详情"}}}},"WhimboxConfig":{"Info":{"kind":"object","ref":"WhimboxConfig.InfoFields","fields":{"Name":{"kind":"str","label":"脚本名称"},"RootPath":{"kind":"str","label":"奇想盒安装根目录（whimbox_app.exe 所在目录；configs/logs 与其同级）","raw":"FolderPath"}}},"Run":{"kind":"object","ref":"WhimboxConfig.RunFields","fields":{"HardTimeLimit":{"kind":"int","label":"单账号运行总时限（分钟），包含等待和全部重试"},"ProxyTimesLimit":{"kind":"int","label":"每日代理次数上限（0=不限）"},"RunTimeLimit":{"kind":"int","label":"运行超时（分钟）：日志静默超过该时长判定卡死"},"RunTimesLimit":{"kind":"int","label":"失败重试次数：只用于「没有上游结论」的异常（进程提前退出/卡死）； 上游自己判负时，仅当失败原因与上一轮不同才继续重试（同一结论连着出现即收口）"},"UseAdmin":{"kind":"bool","label":"以管理员权限启动奇想盒后端（上游强制管理员，缺权限会在起跑即退出； MAS 自身已提权时不重复触发 UAC，子进程自动继承管理员令牌）"}}}}};
const EMULATOR_SCHEMA = {"EmulatorConfig":{"Info":{"kind":"object","ref":"EmulatorConfig.InfoFields","fields":{"Type":{"kind":"enum","label":"模拟器类型","options":["general","mumu","ldplayer","emulator2"]},"Baselines":{"kind":"json","label":"守卫的基准: {设备号: {字段: 值}}, 只记用户显式设过的字段"},"BossKey":{"kind":"str","label":"老板键快捷键配置","raw":"JsonListString"},"ConfigGuard":{"kind":"bool","label":"Emulator 2.0 的稳定模式：开着就把会干扰截图识别的模拟器功能压住, 启动实例前顺带确保一次, 这样新建的实例也会跟着进入安全状态。 关掉只是不再确保, **不会把那些项改回去**——不知道用户原本想要什么值。 Emulator 2.0 的配置守卫：以 MAS 存的这份设置为准, 启动前与关闭后各核验一次, 对不上就写回去。与旧雷电那套「开机拍快照关机还原」不是一回事, 见 utils/emulator2/guard.py"},"ForceKillBeforeLaunch":{"kind":"bool","label":"启动 MuMu 实例前先关闭已在运行的实例并强力清理残留进程 用于已有非管理员实例导致新实例无法以管理员身份启动的场景; 会关掉全部实例, 多开慎用"},"ForceKillOnClose":{"kind":"bool","label":"关闭 MuMu 时强力清理残留进程"},"MaxWaitTime":{"kind":"int","label":"最大等待时间（秒）"},"Name":{"kind":"str","label":"模拟器名称"},"Path":{"kind":"str","label":"模拟器路径","default":null,"raw":"EmulatorManagerPath"},"Paths":{"kind":"str","label":"Emulator 2.0 纳管的模拟器路径列表 [{\"pathId\", \"installPath\", \"alias\", \"type\", \"version\"}]","raw":"JsonListString"},"Slots":{"kind":"str","label":"Emulator 2.0 的设备号槽位表 [{\"slot\", \"pathId\", \"nativeIndex\", \"state\": \"active\"|\"tombstone\"}] 槽位号在本配置内单调递增分配, 移除路径写墓碑, 号码永不复用","raw":"JsonListString"},"StableMode":{"kind":"bool","label":"Emulator 2.0: 稳定模式是否开启"}}}}};
const SETTING_SCHEMA = {"GlobalConfig":{"Data":{"kind":"object","ref":"GlobalConfig.DataFields","fields":{"IfShowNotice":{"kind":"bool","label":"是否显示公告"},"LastMaintenanceUpdated":{"kind":"str","label":"上次维护信息检查时间","raw":"datetime"},"LastNoticeUpdated":{"kind":"str","label":"上次公告更新时间","raw":"datetime"},"LastStageUpdated":{"kind":"str","label":"上次关卡更新时间","raw":"datetime"},"LastStatisticsUpload":{"kind":"str","label":"上次统计上传时间","raw":"datetime"},"LastTelemetryActive":{"kind":"str","label":"上次记录遥测日活的 UTC 日期","raw":"datetime"},"Maintenance":{"kind":"json","label":"维护信息内容"},"MaintenanceETag":{"kind":"str","label":"维护信息的版本标识符"},"Notice":{"kind":"json","label":"公告内容"},"NoticeETag":{"kind":"str","label":"公告的版本标识符"},"ShareAppearanceUploads":{"kind":"json","label":"分享站外观上传记录：{用户名: {外观 ID: {fileId, fileKey, displayName, updatedAt}}}"},"Stage":{"kind":"str","label":"关卡信息","raw":"Virtual[str]"},"StageData":{"kind":"json","label":"关卡信息数据"},"StageETag":{"kind":"str","label":"关卡数据的版本标识符"},"UID":{"kind":"str","label":"唯一标识符","raw":"UUID"}}},"Display":{"kind":"object","ref":"GlobalConfig.DisplayFields","fields":{"IfEnableVirtualDisplay":{"kind":"bool","label":"无人值守时是否允许 MAS 挂载虚拟显示器。 所有真实显示输出都断开后 Windows 只保留一块占位的幻影屏，它照旧上报正常的 分辨率但背后没有输出；冷启动时更会起在很小的分辨率上，把被托管的 PC 端游戏 窗口压小并被游戏写进自己的配置，之后每轮都在同一处失败。挂一块真实的虚拟屏 可从源头断掉。 需要用户自行安装 Parsec 虚拟显示驱动，MAS 不分发驱动。"},"VirtualDisplayMode":{"kind":"enum","label":"虚拟显示器的刷新率（分辨率固定 1920x1080）。 分辨率固定是因为只有它 Windows 给 100% 缩放，再高会被自动上缩放，游戏窗口 又要面对 DPI 虚拟化。取值必须在驱动 advertise 的模式表里，否则会被 BADMODE 拒绝。","options":["1920x1080@60","1920x1080@30"]}}},"Function":{"kind":"object","ref":"GlobalConfig.FunctionFields","fields":{"HistoryRetentionTime":{"kind":"enum","label":"历史记录保留时间（天）","options":["7","15","30","60","90","180","365","0"]},"IfAgreeBilibili":{"kind":"bool","label":"是否同意 Bilibili 协议"},"IfAllowSleep":{"kind":"bool","label":"是否允许睡眠"},"IfBlockAd":{"kind":"bool","label":"是否屏蔽模拟器广告"},"IfEnableTelemetry":{"kind":"bool","label":"是否启用匿名遥测"},"IfPersonalMss":{"kind":"bool","label":"个人版 MSS 的专属编排（灾变防线），只对个人版项目生效， 普通版 MSS 与其它脚本都会忽略它。"},"IfSilence":{"kind":"bool","label":"是否启用静默模式"}}},"Notify":{"kind":"object","ref":"GlobalConfig.NotifyFields","fields":{"AuthorizationCode":{"kind":"str","label":"邮箱授权码"},"CMCCNewMsgApiKey":{"kind":"str","label":"中国移动新消息 Channel API Key"},"FromAddress":{"kind":"str","label":"发件地址"},"IfCMCCNewMsg":{"kind":"bool","label":"是否启用中国移动新消息通知"},"IfKoishiSupport":{"kind":"bool","label":"是否发送Koishi通知"},"IfOpenClawQQ":{"kind":"bool","label":"是否启用 QQ 官方机器人通知（凭据由扫码登录流程管理）"},"IfPushPlyer":{"kind":"bool","label":"是否推送系统通知"},"IfSendMail":{"kind":"bool","label":"是否发送邮件"},"IfSendSixStar":{"kind":"bool","label":"是否发送六星通知"},"IfSendStatistic":{"kind":"bool","label":"是否发送统计信息"},"IfServerChan":{"kind":"bool","label":"是否启用 Server 酱"},"KoishiServerAddress":{"kind":"str","label":"Koishi WebSocket 服务器地址","raw":"UrlString"},"KoishiToken":{"kind":"str","label":"Koishi Token"},"OpenClawQQAppId":{"kind":"str","label":"QQ 官方机器人应用 ID（由扫码登录响应返回）"},"OpenClawQQClientSecret":{"kind":"str","label":"QQ 官方机器人客户端密钥（由扫码登录响应返回）"},"OpenClawQQTargetOpenId":{"kind":"str","label":"QQ 官方机器人目标用户 OpenID（由扫码登录响应返回）"},"SMTPServerAddress":{"kind":"str","label":"SMTP 服务器地址"},"SendTaskResultTime":{"kind":"enum","label":"任务结果推送时间","options":["不推送","任何时刻","仅失败时"]},"ServerChanKey":{"kind":"str","label":"Server 酱密钥"},"ToAddress":{"kind":"str","label":"收件地址"}}},"Replay":{"kind":"object","ref":"GlobalConfig.ReplayFields","fields":{"Enabled":{"kind":"bool","label":"连接已运行的 OBS，在自动代理最终失败时保存回放。"},"MaxReplayCount":{"kind":"int","label":"MAS 副本的保留数量，不清理 OBS 原文件。"},"Password":{"kind":"str","label":"OBS 认证密码按现有敏感配置规则加密落盘。"},"Port":{"kind":"int","label":"OBS WebSocket 仅连接本机。"},"PasswordConfigured":{"kind":"str","label":"OBS 密码是否已配置，只读","default":null,"raw":"Virtual[bool]"}}},"Start":{"kind":"object","ref":"GlobalConfig.StartFields","fields":{"IfMinimizeDirectly":{"kind":"bool","label":"是否启动时直接最小化"},"IfSelfStart":{"kind":"bool","label":"是否自动启动"}}},"UI":{"kind":"object","ref":"GlobalConfig.UIFields","fields":{"IfHideCloseButton":{"kind":"bool","label":"是否隐藏主窗口关闭按钮"},"IfShowTray":{"kind":"bool","label":"是否显示托盘图标"},"IfToTray":{"kind":"bool","label":"是否关闭到托盘"}}},"Update":{"kind":"object","ref":"GlobalConfig.UpdateFields","fields":{"Channel":{"kind":"enum","label":"更新频道","options":["stable","beta"]},"GitHubMirror":{"kind":"enum","label":"GitHub 加速镜像 **只影响 MFW 项目包从 GitHub Release 下载这一条路**（脚本的 `Update.Source` 选 GitHub 时）：国内直连 GitHub 常年 100 多 KB/s， 359MB 的全量包要四十分钟。`Auto` 依次试镜像、全部失败再回直连； `Off` 只直连。MAS 自身的更新与初始化 clone 走前端 mirrorService， 不读这一项；Mirror 酱是另一个源，也不受它影响。","options":["Auto","Off"]},"IfAutoUpdate":{"kind":"bool","label":"是否自动更新"},"MirrorChyanCDK":{"kind":"str","label":"镜像站 CDK"},"PauseUntil":{"kind":"str","label":"暂停更新截止时间，截止日期当天恢复；空值表示未暂停","default":null,"raw":"datetime"},"ProxyAddress":{"kind":"str","label":"代理地址"},"Source":{"kind":"enum","label":"更新源","options":["GitHub","MirrorChyan","AutoSite","CNB"]}}},"Voice":{"kind":"object","ref":"GlobalConfig.VoiceFields","fields":{"Enabled":{"kind":"bool","label":"是否启用语音"},"Type":{"kind":"enum","label":"语音类型","options":["simple","noisy"]}}},"startup_notices":{"kind":"str","raw":"list"}}};

const MODE_LABELS = {
  AutoProxy: "自动代理",
  ScriptConfig: "配置脚本",
  CycleRun: "循环运行",
  Update: "更新",
};

// 关卡选项沿用 AUTO-MAS RESOURCE_STAGE_INFO；活动关不在表里，输入框允许自由填。
const STAGE_OPTIONS = [
  ["-", "禁用"],
  ["*", "当前/上次"],
  ["1-7", "1-7"],
  ["R8-11", "R8-11"],
  ["12-17-HARD", "12-17-HARD"],
  ["LS-6", "经验-6/5"],
  ["CE-6", "龙门币-6/5"],
  ["AP-5", "红票-5"],
  ["CA-5", "技能-5"],
  ["SK-5", "碳-5"],
  ["PR-A-1", "奶/盾芯片"],
  ["PR-A-2", "奶/盾芯片组"],
  ["PR-B-1", "术/狙芯片"],
  ["PR-B-2", "术/狙芯片组"],
  ["PR-C-1", "先/辅芯片"],
  ["PR-C-2", "先/辅芯片组"],
  ["PR-D-1", "近/特芯片"],
  ["PR-D-2", "近/特芯片组"],
];

const SERIES_OPTIONS = ["0", "1", "2", "3", "4", "5", "6", "-1"].map((v) => [v, v]);

const ANNIHILATION_OPTIONS = [
  ["Close", "关闭"],
  ["Annihilation", "当期剿灭"],
  ["Chernobog@Annihilation", "切尔诺伯格"],
  ["LungmenOutskirts@Annihilation", "龙门外环"],
  ["LungmenDowntown@Annihilation", "龙门市区"],
];

const WEEKDAY_OPTIONS = [
  ["Monday", "周一"],
  ["Tuesday", "周二"],
  ["Wednesday", "周三"],
  ["Thursday", "周四"],
  ["Friday", "周五"],
  ["Saturday", "周六"],
  ["Sunday", "周日"],
];

const INFRAST_OPTIONS = [
  ["Normal", "常规换班"],
  ["Rotation", "轮换"],
  ["Custom", "自定义"],
];

const TASK_TOGGLES = [
  ["IfStartUp", "开始唤醒"],
  ["IfFight", "刷理智"],
  ["IfInfrast", "基建换班"],
  ["IfRecruit", "公开招募"],
  ["IfMall", "信用购物"],
  ["IfAward", "领取奖励"],
  ["IfSwitchTheme", "更换主题"],
  ["IfGreenTicketStore", "绿票商店"],
  ["IfDepotMaintain", "库存保持"],
  ["IfEventDepotMaintain", "活动库存保持"],
  ["IfActivityFirst", "活动关优先"],
  ["IfCultivate", "干员养成"],
  ["CultivateAutoRaise", "注入原生养成任务"],
  ["CultivateSkipDuringActivity", "活动期跳过养成"],
  ["CultivateSkipDuringResourceCollection", "资源收集期跳过养成"],
];

// MAA 专用的任务配置布局；其他脚本类型没有 Stage/Task 段时会整块跳过。
const TASK_SECTIONS = [
  {
    group: "Stage",
    title: "理智 / 关卡",
    fields: [
      { key: "StageMode", label: "关卡模式", type: "stageMode" },
      { key: "Stage", label: "主关卡", type: "stage" },
      { key: "Stage_1", label: "备选 1", type: "stage" },
      { key: "Stage_2", label: "备选 2", type: "stage" },
      { key: "Stage_3", label: "备选 3", type: "stage" },
      { key: "MedicineNumb", label: "理智药用量", type: "number", min: 0, max: 9999 },
      { key: "SeriesNumb", label: "连战次数", type: "select", options: SERIES_OPTIONS },
    ],
  },
  { group: "Task", title: "任务开关", type: "toggles" },
  {
    group: "Task",
    title: "剿灭 / 基建 / 活动关",
    fields: [
      { key: "Annihilation", label: "剿灭任务", type: "select", options: ANNIHILATION_OPTIONS },
      {
        key: "AnnihilationStartWeekday",
        label: "剿灭开始日",
        type: "select",
        options: WEEKDAY_OPTIONS,
      },
      { key: "InfrastMode", label: "基建模式", type: "select", options: INFRAST_OPTIONS },
      { key: "ActivityStageIndex", label: "活动关序号", type: "number", min: 1, max: 9999 },
      { key: "ActivityMedicineNumb", label: "活动关理智药", type: "number", min: 0, max: 9999 },
      { key: "InfrastName", label: "当前基建方案", type: "readonly" },
    ],
  },
  { group: "Task", title: "库存保持计划", type: "depot", key: "DepotMaintainPlans" },
  { group: "Task", title: "活动库存保持", type: "eventDepot", key: "EventDepotMaintainPlans" },
  { group: "Task", title: "养成目标", type: "cultivate", key: "CultivateTargets" },
];

// 三个 JSON 数组字段的真实元素结构（与 AUTO-MAS 源码对齐）：
//   DepotMaintainPlans     {Stage, DropId, DropCount}
//   EventDepotMaintainPlans {StageType: all|material|activity|orundum, StageIndex, DropCount, OrundumDropCount, Skip}
//   CultivateTargets       {operator_id, goals:[{kind, target_id, to_level, state}]}
const EVENT_PLAN_TYPES = [
  ["activity", "全部活动关"],
  ["material", "活动材料关"],
  ["orundum", "合成玉关"],
];

const CULTIVATE_KINDS = [
  ["elite", "精英化"],
  ["skill", "技能等级"],
  ["mastery", "专精"],
  ["module", "模组"],
];

const CULTIVATE_STATES = [
  ["not_started", "未开始"],
  ["in_progress", "进行中"],
  ["achieved", "已达成"],
  ["pending_confirm", "待确认"],
  ["cultivating", "培养中"],
];

const CULTIVATE_LEVELS = {
  elite: [1, 2],
  skill: [2, 3, 4, 5, 6, 7],
  mastery: [1, 2, 3],
  module: [1, 2, 3],
};

const elements = {
  runtime: document.getElementById("runtime-status"),
  baseUrl: document.getElementById("base-url"),
  refresh: document.getElementById("refresh-button"),
  error: document.getElementById("error-notice"),
  scriptList: document.getElementById("script-list"),
  userList: document.getElementById("user-list"),
  detailHead: document.getElementById("detail-head"),
  detailTitle: document.getElementById("detail-title"),
  userCreate: document.getElementById("user-create"),
  runningPanel: document.getElementById("running-panel"),
  metrics: {
    scripts: document.getElementById("metric-scripts"),
    running: document.getElementById("metric-running"),
    plans: document.getElementById("metric-plans"),
  },
  drawer: document.getElementById("drawer"),
  scriptDrawer: document.getElementById("script-drawer"),
  scriptDrawerTitle: document.getElementById("script-drawer-title"),
  scriptDrawerClose: document.getElementById("script-drawer-close"),
  scriptDrawerCancel: document.getElementById("script-drawer-cancel"),
  scriptDrawerSave: document.getElementById("script-drawer-save"),
  scriptSaveState: document.getElementById("script-save-state"),
  drawerTitle: document.getElementById("drawer-title"),
  drawerClose: document.getElementById("drawer-close"),
  drawerCancel: document.getElementById("drawer-cancel"),
  drawerSave: document.getElementById("drawer-save"),
  confirm: document.getElementById("confirm"),
  confirmText: document.getElementById("confirm-text"),
  confirmOk: document.getElementById("confirm-ok"),
  confirmCancel: document.getElementById("confirm-cancel"),
  confirmSave: document.getElementById("confirm-save"),
  saveState: document.getElementById("save-state"),
  fieldName: document.getElementById("field-name"),
  fieldStatus: document.getElementById("field-status"),
  fieldQuick: document.getElementById("field-quick"),
  fieldBase: document.getElementById("field-base"),
  infrastCurrent: document.getElementById("infrast-current"),
  infrastDir: document.getElementById("infrast-dir"),
  infrastScan: document.getElementById("infrast-scan"),
  infrastList: document.getElementById("infrast-list"),
  json: document.getElementById("json-editor"),
  tabs: Array.from(document.querySelectorAll(".drawer-tab")),
  panels: Array.from(document.querySelectorAll(".tab-panel")),
  taskForm: document.getElementById("task-form"),
  taskEmptyHint: document.getElementById("task-empty-hint"),
  taskQuickHint: document.getElementById("task-quick-hint"),
  stageOptions: document.getElementById("stage-options"),
  viewTabs: Array.from(document.querySelectorAll(".view-tab")),
  views: Array.from(document.querySelectorAll(".view")),
  planList: document.getElementById("plan-list"),
  planTitle: document.getElementById("plan-title"),
  planEditor: document.getElementById("plan-editor"),
  planCreate: document.getElementById("plan-create"),
  planSave: document.getElementById("plan-save"),
  planDelete: document.getElementById("plan-delete"),
  queueList: document.getElementById("queue-list"),
  queueTitle: document.getElementById("queue-title"),
  queueEditor: document.getElementById("queue-editor"),
  queueCreate: document.getElementById("queue-create"),
  queueSave: document.getElementById("queue-save"),
  queueDelete: document.getElementById("queue-delete"),
  queueRun: document.getElementById("queue-run"),
  histStart: document.getElementById("hist-start"),
  histEnd: document.getElementById("hist-end"),
  histMode: document.getElementById("hist-mode"),
  histSearch: document.getElementById("hist-search"),
  histDayList: document.getElementById("hist-day-list"),
  histTitle: document.getElementById("hist-title"),
  histBody: document.getElementById("hist-body"),
  scriptCreate: document.getElementById("script-create"),
  bindingList: document.getElementById("binding-list"),
  bindingTitle: document.getElementById("binding-title"),
  bindingEditor: document.getElementById("binding-editor"),
  bindingCreate: document.getElementById("binding-create"),
  bindingDelete: document.getElementById("binding-delete"),
  timedList: document.getElementById("timed-list"),
  timedTitle: document.getElementById("timed-title"),
  timedEditor: document.getElementById("timed-editor"),
  timedRefresh: document.getElementById("timed-refresh"),
  scriptConfig: document.getElementById("script-config"),
  scriptStart: document.getElementById("script-start"),
  startMode: document.getElementById("start-mode"),
  scriptDelete: document.getElementById("script-delete"),
  scriptForm: document.getElementById("script-form"),
  scriptJson: document.getElementById("script-json"),
  emulatorList: document.getElementById("emulator-list"),
  emulatorTitle: document.getElementById("emulator-title"),
  emulatorEditor: document.getElementById("emulator-editor"),
  emulatorCreate: document.getElementById("emulator-create"),
  emulatorSave: document.getElementById("emulator-save"),
  emulatorDelete: document.getElementById("emulator-delete"),
  emulatorSearch: document.getElementById("emulator-search"),
  settingGroups: document.getElementById("setting-groups"),
  settingTitle: document.getElementById("setting-title"),
  settingEditor: document.getElementById("setting-editor"),
  settingTest: document.getElementById("setting-test"),
  webhookCreate: document.getElementById("webhook-create"),
  schedTarget: document.getElementById("sched-target"),
  schedTargetHint: document.getElementById("sched-target-hint"),
  schedResume: document.getElementById("sched-resume"),
  schedResumeField: document.getElementById("sched-resume-field"),
  schedMode: document.getElementById("sched-mode"),
  schedUsers: document.getElementById("sched-users"),
  schedUsersAll: document.getElementById("sched-users-all"),
  schedUsersNone: document.getElementById("sched-users-none"),
  schedScopeCount: document.getElementById("sched-scope-count"),
  schedStart: document.getElementById("sched-start"),
  schedPowerBox: document.getElementById("sched-power"),
  schedPowerApply: document.getElementById("sched-power-apply"),
  schedPowerCancel: document.getElementById("sched-power-cancel"),
  schedCountdown: document.getElementById("sched-countdown"),
  schedTitle: document.getElementById("sched-title"),
  schedRefresh: document.getElementById("sched-refresh"),
  schedTasks: document.getElementById("sched-tasks"),
  schedScheduled: document.getElementById("sched-scheduled"),
  toast: document.getElementById("toast"),
};

const state = {
  overview: null,
  features: {},
  view: "scripts",
  plans: [],
  selectedPlan: null,
  editingPlan: null,
  queues: [],
  selectedQueue: null,
  queueDetail: null,
  histDays: [],
  bindings: [],
  selectedBinding: "",
  bindingDraft: null,
  bindingScript: "",
  bindingUsers: {},
  timed: null,
  selectedTimed: "",
  subscribers: null,
  selectedHistDay: null,
  selectedScript: null,
  users: [],
  editing: null,
  drawerMode: "user",
  scriptDrawerScript: "",
  activeTab: "basic",
  stageList: null,
  stageExtra: [],
  depotItems: null,
  cultivateOps: null,
  customInfrastFiles: null,
  maaendOptions: null,
  maaendTasks: null,
  maaendScript: "",
  scriptFoldOpen: null,
  maaendNative: null,
  maaendNativeUser: null,
  supplySearch: "",
  supplyCat: "all",
  supplyOnlySet: false,
  maafwDefs: null,
  maafwScript: "",
  maafwOpenTasks: [],
  whimboxCatalog: null,
  whimboxScript: "",
  oknteFiles: null,
  oknteDirty: {},
  oknteScript: "",
  oknteLabels: {},
  oknteConfigPath: "",
  bgiConfigs: [],
  bgiCustomGroups: [],
  bgiScript: "",
  bgiOrder: null,
  bgiOrderStamp: "",
  bgiOrderDirty: false,
  bgiCandidates: null,
  bgiOrderError: "",
  zzzCatalog: [],
  zzzScript: "",
  zzzTeams: null,
  zzzAutoBattle: [],
  zzzAgents: [],
  zzzTeamKey: "",
  emulators: [],
  selectedEmulator: null,
  emulatorData: null,
  settings: null,
  settingGroup: "Notify",
  webhooks: [],
  editingWebhook: null,
  busy: false,
  toastTimer: null,
  schedTasks: [],
  schedScheduled: [],
  schedPower: {},
  schedPowerOptions: [],
  schedSource: "script",
  schedTarget: "",
  schedScopeLoading: false,
  schedScopeCache: {},
  schedScriptId: "",
  schedUsers: [],
  schedQueues: [],
  schedQueueId: "",
  schedScopeItems: [],
  schedSelectedUsers: null,
  schedOpenLogs: [],
  schedTimer: null,
  schedSigTasks: "",
  schedSigScheduled: "",
  schedSigPower: "",
  taskFoldScope: "",
  taskFoldOpen: [],
  editSnapshot: "",
  scriptSnapshot: "",
};

// 功能开关由插件配置决定，overview 接口带下来；缺省一律开启。
function featureOn(name) {
  const features = state.features || {};
  return features[name] !== false;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message, isError = false) {
  window.clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.toggle("is-error", isError);
  elements.toast.classList.remove("is-hidden");
  state.toastTimer = window.setTimeout(() => {
    elements.toast.classList.add("is-hidden");
  }, 3200);
}

function setError(message = "") {
  elements.error.textContent = message;
  elements.error.classList.toggle("is-hidden", !message);
}

function setRuntime(text, kind = "") {
  elements.runtime.querySelector("span:last-child").textContent = text;
  elements.runtime.classList.toggle("is-online", kind === "online");
  elements.runtime.classList.toggle("is-offline", kind === "offline");
}

function unwrapBridgeResult(result) {
  // AstrBot 的错误信封是 {status:"error", message, data}，没有 code 字段；
  // 老版本/其他接口又可能给 code。两种都要认，否则失败会被当成空数据静默吞掉。
  if (result && typeof result === "object") {
    const numericCode = typeof result.code === "number" && result.code !== 200;
    if (result.status === "error" || numericCode) {
      throw new Error(result.message || "接口返回失败");
    }
  }
  return result;
}

async function callApi(endpoint, params) {
  const result = await bridge.apiGet(endpoint, params);
  return unwrapBridgeResult(result);
}

async function postApi(endpoint, payload) {
  const result = await bridge.apiPost(endpoint, payload);
  return unwrapBridgeResult(result);
}

async function loadOverview() {
  setError("");
  try {
    const data = await callApi("overview");
    state.overview = data;
    state.features = data.features || {};
    if (data.online) {
      setRuntime("AUTO-MAS 已连接", "online");
      elements.baseUrl.textContent = data.baseUrl || "";
    } else {
      setRuntime("AUTO-MAS 未连接", "offline");
      setError(data.error || "连接 AUTO-MAS 失败");
    }
    render();
  } catch (error) {
    setRuntime("面板接口异常", "offline");
    setError(error.message);
  }
}

function render() {
  const overview = state.overview || {};
  const scripts = overview.scripts || [];
  const running = overview.running || [];
  const plans = overview.plans || [];
  const runningIds = {};
  running.forEach(function (task) {
    if (task && task.scriptId) runningIds[task.scriptId] = true;
  });

  elements.metrics.scripts.textContent = String(scripts.length);
  elements.metrics.running.textContent = String(running.length);
  elements.metrics.plans.textContent = String(plans.length);

  elements.scriptList.innerHTML = scripts.length
    ? scripts
        .map(
          (item) => `<li class="script-item ${item.uid === state.selectedScript ? "is-active" : ""}${runningIds[item.uid] ? " is-running" : ""}" data-uid="${escapeHtml(item.uid)}">
            <div class="script-name">${escapeHtml(item.name)}</div>
            <div class="script-meta">${escapeHtml(item.typeLabel)}${item.status ? "" : " · 已停用"}${runningIds[item.uid] ? " · 运行中" : ""}</div>
            <div class="script-actions"><button class="mini-button script-arrow" type="button" title="上移" aria-label="上移" data-up="${escapeHtml(item.uid)}">↑</button><button class="mini-button script-arrow" type="button" title="下移" aria-label="下移" data-down="${escapeHtml(item.uid)}">↓</button></div>
          </li>`,
        )
        .join("")
    : '<li class="empty">还没有托管项，先去 AUTO-MAS 里创建一个。</li>';

  elements.scriptList.querySelectorAll(".script-item").forEach((node) => {
    node.addEventListener("click", () => selectScript(node.dataset.uid));
  });
  elements.scriptList.querySelectorAll("[data-up]").forEach((node) => {
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      moveScript(node.dataset.up, -1);
    });
  });
  elements.scriptList.querySelectorAll("[data-down]").forEach((node) => {
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      moveScript(node.dataset.down, 1);
    });
  });

  renderRunning(running);
  applyFeatures();
}

const VIEW_FEATURE = {
  scripts: null,
  plans: "plans",
  queue: "queue",
  emulator: "emulator",
  history: "history",
  settings: "settings",
  scheduler: "scheduler",
  binding: "binding",
  timed: "timed",
};

function applyFeatures() {
  elements.viewTabs.forEach((tab) => {
    const key = VIEW_FEATURE[tab.dataset.view];
    tab.classList.toggle("is-hidden", Boolean(key) && !featureOn(key));
  });
  if (state.view !== "scripts") {
    const key = VIEW_FEATURE[state.view];
    if (key && !featureOn(key)) switchView("scripts");
  }
  const taskTab = elements.tabs.find((tab) => tab.dataset.tab === "task");
  if (taskTab) taskTab.classList.toggle("is-hidden", !featureOn("task_config"));
  if (!featureOn("scripts")) closeScriptDrawer();
  if (!featureOn("task_config") && state.activeTab === "task") switchTab("basic");
  if (elements.scriptCreate) elements.scriptCreate.classList.toggle("is-hidden", !featureOn("scripts"));
  if (elements.emulatorCreate) elements.emulatorCreate.classList.toggle("is-hidden", !featureOn("emulator"));
  if (elements.settingTest) elements.settingTest.classList.toggle("is-hidden", !featureOn("settings"));
  if (elements.webhookCreate) elements.webhookCreate.classList.toggle("is-hidden", !featureOn("settings"));
  const canManage = featureOn("accounts");
  if (elements.userCreate) {
    elements.userCreate.classList.toggle(
      "is-hidden",
      !canManage || !state.selectedScript,
    );
  }
}

function renderRunning(running) {
  if (!running.length) {
    elements.runningPanel.innerHTML = "";
    return;
  }
  elements.runningPanel.innerHTML = `<div class="running-panel">
    <p class="hint">正在运行的任务</p>
    <div class="running-rows">${running
      .map(
        (task) => `<div class="running-row">
          <span>${escapeHtml(task.name || task.taskId)} · ${escapeHtml(
            MODE_LABELS[task.mode] || task.mode || "未知模式",
          )}</span>
          <button class="mini-button is-danger" data-task="${escapeHtml(task.taskId)}" type="button"><i class=&quot;mdi mdi-stop&quot;></i> 停止</button>
        </div>`,
      )
      .join("")}</div>
  </div>`;
  elements.runningPanel.querySelectorAll("[data-task]").forEach((node) => {
    node.addEventListener("click", () => stopTask(node.dataset.task));
  });
}

// ---- 视图切换 ----

function switchView(name) {
  const gate = VIEW_FEATURE[name];
  if (gate && !featureOn(gate)) {
    if (state.view && state.view !== name) showToast("这个功能在插件配置里被关掉了。", true);
    return;
  }
  state.view = name;
  elements.viewTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.view === name);
  });
  elements.views.forEach((view) => {
    view.classList.toggle("is-hidden", view.dataset.view !== name);
  });
  if (name === "plans" && featureOn("plans") && !state.plans.length) {
    loadPlans();
  }
  if (name === "queue" && featureOn("queue")) {
    loadQueues();
  }
  if (name === "history" && featureOn("history") && !state.histDays.length) {
    loadHistory();
  }
  if (name === "emulator" && featureOn("emulator")) {
    // 托管抽屉里可能已经顺手拉过模拟器列表，这里必须补一次渲染，否则列表是空的。
    if (!state.emulators.length) loadEmulators();
    else renderEmulatorList();
  }
  if (name === "binding" && featureOn("binding")) {
    loadBindings();
  }
  if (name === "timed" && featureOn("timed")) {
    loadTimed();
  }
  if (name === "scheduler" && featureOn("scheduler")) {
    loadScheduler();
    startSchedPolling();
  } else {
    stopSchedPolling();
  }
  if (name === "settings" && featureOn("settings")) {
    if (!state.settings) loadSettings();
    else renderSettingGroups();
    loadWebhooks();
  }
}


// ---- 定时队列 ----

function timedData() {
  return state.timed || { queues: [], runs: [], takeover: [] };
}

async function loadTimed() {
  try {
    state.timed = await callApi("timed", {});
  } catch (error) {
    setError(error);
    return;
  }
  const rows = timedData().queues || [];
  if (!state.selectedTimed && rows.length) state.selectedTimed = rows[0].queueId;
  renderTimedList();
  renderTimedEditor();
}

function timedQueue(queueId) {
  const rows = timedData().queues || [];
  return rows.find(function (row) { return row.queueId === queueId; }) || null;
}

function renderTimedList() {
  const host = elements.timedList;
  if (!host) return;
  const rows = timedData().queues || [];
  if (!rows.length) {
    host.innerHTML = '<li class="empty">AUTO-MAS 里还没有调度队列。</li>';
    return;
  }
  host.innerHTML = rows.map(function (row) {
    const active = row.queueId === state.selectedTimed ? " is-active" : "";
    const slots = row.slots || [];
    let flag = "没开定时";
    if (row.takeover) flag = "接管中";
    else if (row.timeEnabled) flag = "AUTO-MAS 自己定时";
    return '<li class="timed-item' + active + '" data-timed="' + escapeHtml(row.queueId) + '">' +
      '<div class="timed-item-main">' +
      '<span class="timed-name">' + escapeHtml(row.name) + '</span>' +
      '<span class="timed-meta">' + escapeHtml(flag) + ' · ' + slots.length + ' 个定时</span>' +
      '</div></li>';
  }).join("");
  host.querySelectorAll("[data-timed]").forEach(function (node) {
    node.addEventListener("click", function () { openTimed(node.dataset.timed); });
  });
}

function openTimed(queueId) {
  state.selectedTimed = queueId;
  renderTimedList();
  renderTimedEditor();
}

function timedSlotRows(queue) {
  const slots = queue.slots || [];
  if (!slots.length) {
    return '<p class="empty">这个队列还没有定时项，去「队列」页给它加一个。</p>';
  }
  return '<ul class="timed-slots">' + slots.map(function (slot) {
    const days = (slot.days || []).join("、");
    return '<li class="timed-slot">' +
      '<span class="timed-slot-time">' + escapeHtml(slot.time || "--:--") + '</span>' +
      '<span class="timed-slot-days">' + escapeHtml(days || "每天") + '</span>' +
      '<span class="timed-slot-state' + (slot.enabled ? "" : " is-off") + '">' + (slot.enabled ? "启用" : "停用") + '</span>' +
      '</li>';
  }).join("") + '</ul>';
}

function timedClock(value) {
  const text = String(value || "");
  return text.length >= 16 ? text.slice(11, 16) : "--:--";
}

function timedRunRow(run) {
  const status = String(run.status || "");
  let cls = "";
  let text = run.detail || status || "结束";
  if (status === "success") { cls = " is-done"; text = "完成"; }
  else if (status === "error") { cls = " is-error"; text = text || "失败"; }
  const planned = String(run.planned || "").replace("T", " ").slice(0, 16);
  return '<li class="timed-run">' +
    '<span class="timed-run-day">' + escapeHtml(planned || "—") + '</span>' +
    '<span class="timed-run-span">' + escapeHtml(timedClock(run.started)) + ' → ' + escapeHtml(timedClock(run.finished)) + '</span>' +
    '<span class="timed-run-name">' + escapeHtml(run.queueName || run.queueId || "") + '</span>' +
    '<span class="timed-run-state' + cls + '">' + escapeHtml(String(text)) + '</span>' +
    '</li>';
}

function renderTimedEditor() {
  const host = elements.timedEditor;
  if (!host) return;
  const queue = timedQueue(state.selectedTimed);
  if (!queue) {
    if (elements.timedTitle) elements.timedTitle.textContent = "选一个队列";
    host.innerHTML = '<p class="empty">左边选一个队列。</p>';
    return;
  }
  if (elements.timedTitle) elements.timedTitle.textContent = queue.name;
  let intro = "这个队列的定时没开。";
  if (queue.takeover) {
    intro = "现在由调度台接管：AUTO-MAS 自己的定时已经关掉，到点先进调度台的队列，前面那批跑完才轮到它。";
  } else if (queue.timeEnabled) {
    intro = "现在还是 AUTO-MAS 自己在定时：到点会独立起一个任务，正在跑的脚本可能被跳过。想排队就点接管。";
  }
  const runs = timedData().runs || [];
  const mine = runs.filter(function (run) { return run.queueId === queue.queueId; });
  const parts = [];
  parts.push('<div class="timed-block"><div class="queue-block-head"><span>定时代管</span></div>');
  parts.push('<p class="hint">' + escapeHtml(intro) + '</p>');
  parts.push('<button class="' + (queue.takeover ? "mini-button is-danger" : "primary-button") + '" id="timed-toggle" data-timed-toggle="' + escapeHtml(queue.queueId) + '" data-next="' + (queue.takeover ? "0" : "1") + '" type="button">' + (queue.takeover ? "取消接管" : "接管定时") + '</button>');
  parts.push('</div>');
  parts.push('<div class="timed-block"><div class="queue-block-head"><span>定时项</span></div>' + timedSlotRows(queue) + '</div>');
  parts.push('<div class="timed-block"><div class="queue-block-head"><span>这个队列最近执行</span></div>' +
    (mine.length ? '<ul class="timed-runs">' + mine.map(timedRunRow).join("") + '</ul>' : '<p class="empty">还没记录过执行。</p>') + '</div>');
  if (queue.cycle) {
    parts.push('<p class="hint">这个队列是循环模式，循环队列由队列项自己的周期驱动，这里只管普通定时。</p>');
  }
  host.innerHTML = parts.join("");
  const toggle = host.querySelector("[data-timed-toggle]");
  if (toggle) {
    toggle.addEventListener("click", function () {
      toggleTimed(toggle.dataset.timedToggle, toggle.dataset.next === "1");
    });
  }
}

async function toggleTimed(queueId, on) {
  try {
    await postApi("timed/takeover", { queueId: queueId, on: on });
  } catch (error) {
    setError(error);
    return;
  }
  showToast(on ? "定时接管已打开。" : "已经交还给 AUTO-MAS。");
  await loadTimed();
}


// ---- 多人绑定 ----

function bindingOf(qq) {
  return (state.bindings || []).find(function (row) { return row.qq === qq; }) || null;
}

async function loadBindings() {
  try {
    const data = await callApi("bindings", {});
    state.bindings = data.bindings || [];
  } catch (error) {
    setError(error);
    return;
  }
  renderBindingList();
  if (state.selectedBinding || state.bindingDraft) renderBindingEditor();
}

function renderBindingList() {
  if (!elements.bindingList) return;
  const rows = state.bindings || [];
  if (!rows.length) {
    elements.bindingList.innerHTML = '<li class="empty">还没有人绑定账号。点右上角「新增」把 QQ 和账号对上。</li>';
    return;
  }
  elements.bindingList.innerHTML = rows
    .map(function (row) {
      const active = row.qq === state.selectedBinding && !state.bindingDraft;
      const count = (row.bindings || []).length;
      return (
        '<li class="binding-item' + (active ? " is-active" : "") + '" data-qq="' + escapeHtml(row.qq) + '">' +
        '<div class="binding-main">' +
        '<span class="binding-name">' + escapeHtml(row.display || row.qq) + "</span>" +
        '<span class="binding-meta">' + escapeHtml(row.qq) + " · " + count + " 个账号</span>" +
        "</div>" +
        "</li>"
      );
    })
    .join("");
  elements.bindingList.querySelectorAll("[data-qq]").forEach(function (node) {
    node.addEventListener("click", function () { openBinding(node.dataset.qq); });
  });
}

function openBinding(qq) {
  state.selectedBinding = qq;
  state.bindingDraft = null;
  renderBindingList();
  renderBindingEditor();
}

function startBindingDraft() {
  state.selectedBinding = "";
  state.bindingDraft = { qq: "", display: "" };
  renderBindingList();
  renderBindingEditor();
}

function bindingScriptOptions(current) {
  const scripts = (state.overview && state.overview.scripts) || [];
  const options = ['<option value="">选一个托管项</option>'];
  scripts.forEach(function (item) {
    const selected = item.uid === current ? " selected" : "";
    options.push('<option value="' + escapeHtml(item.uid) + '"' + selected + ">" + escapeHtml(item.name + " · " + item.typeLabel) + "</option>");
  });
  return options.join("");
}

function bindingUserOptions(scriptId, current) {
  const users = (state.bindingUsers || {})[scriptId] || [];
  if (!users.length) return '<option value="">先选托管项</option>';
  return ['<option value="">选一个账号</option>']
    .concat(
      users.map(function (user) {
        const selected = user.uid === current ? " selected" : "";
        return '<option value="' + escapeHtml(user.uid) + '"' + selected + ">" + escapeHtml(user.name) + "</option>";
      }),
    )
    .join("");
}

function renderBindingEditor() {
  const host = elements.bindingEditor;
  if (!host) return;
  const draft = state.bindingDraft;
  const record = draft ? null : bindingOf(state.selectedBinding);
  if (!draft && !record) {
    elements.bindingTitle.textContent = "选一个用户";
    host.innerHTML = '<p class="empty">左边选一个人，或者点右上角「新增」。</p>';
    if (elements.bindingDelete) elements.bindingDelete.classList.add("is-hidden");
    return;
  }
  const rows = record ? record.bindings || [] : [];
  const scriptId = state.bindingScript || "";
  const parts = [];
  if (draft) {
    elements.bindingTitle.textContent = "新增绑定";
    parts.push('<div class="binding-block"><div class="queue-block-head"><span>这个人是谁</span></div><div class="queue-grid">' +
      '<label class="queue-field"><span class="queue-label">QQ 号</span><input type="text" id="bind-qq" value="' + escapeHtml(draft.qq) + '" placeholder="纯数字"></label>' +
      '<label class="queue-field"><span class="queue-label">昵称（随便填，方便认）</span><input type="text" id="bind-display" value="' + escapeHtml(draft.display) + '" placeholder="群昵称"></label>' +
      "</div></div>");
  } else {
    elements.bindingTitle.textContent = (record.display || record.qq) + " · " + record.qq;
    parts.push('<div class="binding-block"><div class="queue-block-head"><span>已绑定 ' + rows.length + " 个账号</span></div>");
    if (!rows.length) {
      parts.push('<p class="empty">这个人还没绑账号。</p>');
    } else {
      parts.push('<ul class="binding-rows">');
      rows.forEach(function (row) {
        parts.push('<li class="binding-row"><span class="binding-row-main">' + escapeHtml(row.scriptName) + " / " + escapeHtml(row.userName) + "</span>" +
          '<button class="mini-button is-danger" data-unbind="' + escapeHtml(row.scriptId) + '" type="button">解绑</button></li>');
      });
      parts.push("</ul>");
    }
    parts.push("</div>");
  }
  parts.push('<div class="binding-block"><div class="queue-block-head"><span>绑一个账号</span></div><div class="queue-grid">' +
    '<label class="queue-field"><span class="queue-label">托管项</span><select id="bind-script">' + bindingScriptOptions(scriptId) + "</select></label>" +
    '<label class="queue-field"><span class="queue-label">账号</span><select id="bind-user">' + bindingUserOptions(scriptId, "") + "</select></label>" +
    "</div>" +
    '<p class="hint" id="bind-hint">一个账号只能绑给一个人；绑上之后 /mas 启动 就会跑它。</p>' +
    '<div class="sched-inline"><button class="primary-button" id="bind-add" type="button"><i class="mdi mdi-link"></i> 绑定</button>' +
    (draft ? '<button class="mini-button" id="bind-cancel" type="button">取消</button>' : "") +
    "</div></div>");
  host.innerHTML = parts.join("");
  if (elements.bindingDelete) {
    elements.bindingDelete.classList.toggle("is-hidden", Boolean(draft) || !record);
  }
  const scriptSelect = host.querySelector("#bind-script");
  if (scriptSelect) {
    scriptSelect.addEventListener("change", function () {
      state.bindingScript = scriptSelect.value;
      loadBindingUsers(scriptSelect.value).then(function () { renderBindingEditor(); });
    });
  }
  const qqInput = host.querySelector("#bind-qq");
  const displayInput = host.querySelector("#bind-display");
  if (qqInput) qqInput.addEventListener("input", function () { if (state.bindingDraft) state.bindingDraft.qq = qqInput.value.trim(); });
  if (displayInput) displayInput.addEventListener("input", function () { if (state.bindingDraft) state.bindingDraft.display = displayInput.value.trim(); });
  host.querySelectorAll("[data-unbind]").forEach(function (node) {
    node.addEventListener("click", function () { removeBinding(state.selectedBinding, node.dataset.unbind); });
  });
  const addButton = host.querySelector("#bind-add");
  if (addButton) addButton.addEventListener("click", addBinding);
  const cancelButton = host.querySelector("#bind-cancel");
  if (cancelButton) cancelButton.addEventListener("click", function () { state.bindingDraft = null; renderBindingList(); renderBindingEditor(); });
}

async function loadBindingUsers(scriptId) {
  state.bindingUsers = state.bindingUsers || {};
  if (!scriptId) return;
  if (state.bindingUsers[scriptId]) return;
  try {
    const data = await callApi("users", { scriptId: scriptId });
    state.bindingUsers[scriptId] = data.users || [];
  } catch (error) {
    setError(error);
  }
}

async function addBinding() {
  const host = elements.bindingEditor;
  if (!host) return;
  const qq = state.bindingDraft ? state.bindingDraft.qq : state.selectedBinding;
  const scriptSelect = host.querySelector("#bind-script");
  const userSelect = host.querySelector("#bind-user");
  const scriptId = scriptSelect ? scriptSelect.value : "";
  const userId = userSelect ? userSelect.value : "";
  if (!qq) { showToast("先填 QQ 号。", true); return; }
  if (!scriptId) { showToast("先选托管项。", true); return; }
  if (!userId) { showToast("先选账号。", true); return; }
  try {
    await postApi("binding/add", {
      qq: qq,
      display: state.bindingDraft ? state.bindingDraft.display : (bindingOf(qq) || {}).display || "",
      scriptId: scriptId,
      userId: userId,
    });
  } catch (error) {
    setError(error);
    return;
  }
  showToast("绑好了。");
  state.bindingDraft = null;
  state.selectedBinding = qq;
  state.bindingScript = scriptId;
  await loadBindings();
  renderBindingEditor();
}

async function removeBinding(qq, scriptId) {
  if (!qq) return;
  try {
    await postApi("binding/remove", { qq: qq, scriptId: scriptId || "" });
  } catch (error) {
    setError(error);
    return;
  }
  showToast("解绑了。");
  await loadBindings();
  renderBindingEditor();
}
// ---- 调度中心 ----

const SCHED_STATUS_LABELS = {
  等待: "等待",
  运行: "运行中",
  跳过: "跳过",
  异常: "失败",
  完成: "完成",
};

const SCHED_STATUS_CLASS = {
  等待: "is-waiting",
  运行: "is-running",
  跳过: "is-skip",
  异常: "is-error",
  完成: "is-done",
};

function schedStatusText(status) {
  const key = String(status ?? "").trim();
  if (!key) return "—";
  return SCHED_STATUS_LABELS[key] || key;
}

function schedStatusClass(status) {
  return SCHED_STATUS_CLASS[String(status ?? "").trim()] || "";
}

function schedScriptList() {
  return (state.overview && state.overview.scripts) || [];
}

function schedScriptName(scriptId) {
  const id = String(scriptId ?? "");
  if (!id) return "—";
  const hit = schedScriptList().find((item) => item.uid === id);
  if (hit) return hit.name || id;
  return id.slice(0, 8);
}

const SCHED_SCRIPT_MODES = [
  ["AutoProxy", "自动代理（按托管项配置跑）"],
  ["CycleRun", "循环运行（跑完接着下一轮）"],
  ["ScriptConfig", "按脚本自己的配置跑"],
  ["Update", "仅更新脚本"],
];

const SCHED_QUEUE_MODES = [
  ["AutoProxy", "自动代理（按队列顺序跑）"],
  ["CycleRun", "循环运行（队列循环）"],
];

function schedQueueList() {
  return state.schedQueues || [];
}

function schedQueueName(item) {
  const info = (item && item.data && item.data.Info) || {};
  return String(info.Name || (item && item.uid) || "");
}

function schedQueueOf() {
  const list = schedQueueList();
  if (state.schedQueueId && list.some((item) => item.uid === state.schedQueueId)) {
    return state.schedQueueId;
  }
  return list.length ? list[0].uid : "";
}

// 运行范围统一成「脚本 → 账号」两段，单个托管项就是只有一组的特例。
function schedScopeRows() {
  if (state.schedSource === "queue") return state.schedScopeItems || [];
  const scriptId = schedScriptOf();
  if (!scriptId) return [];
  return [{ scriptId: scriptId, scriptName: schedScriptName(scriptId), users: state.schedUsers || [] }];
}

function schedScopeUsers() {
  const out = [];
  schedScopeRows().forEach((row) => {
    (row.users || []).forEach((user) => out.push(user));
  });
  return out;
}

function renderSchedModes() {
  if (!elements.schedMode) return;
  const current = elements.schedMode.value;
  const list = state.schedSource === "queue" ? SCHED_QUEUE_MODES : SCHED_SCRIPT_MODES;
  const keep = list.some((item) => item[0] === current) ? current : list[0][0];
  elements.schedMode.innerHTML = list
    .map((pair) => {
      const selected = pair[0] === keep ? " selected" : "";
      return '<option value="' + pair[0] + '"' + selected + ">" + pair[1] + "</option>";
    })
    .join("");
}

// 运行来源合成一个下拉：queue:<队列 uid> 或 script:<托管项 uid>。
function schedTargetValue() {
  if (state.schedSource === "queue") return "queue:" + (state.schedQueueId || "");
  return "script:" + (state.schedScriptId || schedScriptOf());
}

function setSchedTarget(value) {
  const text = String(value || "");
  const cut = text.indexOf(":");
  const kind = cut > 0 ? text.slice(0, cut) : "";
  const id = cut > 0 ? text.slice(cut + 1) : "";
  if (kind === "queue") {
    state.schedSource = "queue";
    state.schedQueueId = id;
    state.schedTarget = "queue:" + id;
  } else {
    state.schedSource = "script";
    state.schedScriptId = id;
    state.schedTarget = "script:" + id;
  }
}

function renderSchedTargets() {
  if (!elements.schedTarget) return;
  const queues = schedQueueList();
  const scripts = schedScriptList();
  if (state.schedSource === "queue" && !state.schedQueueId) state.schedQueueId = schedQueueOf();
  if (state.schedSource !== "queue" && !state.schedScriptId) state.schedScriptId = schedScriptOf();
  const current = schedTargetValue();
  state.schedTarget = current;
  const groups = [];
  if (queues.length) {
    groups.push(
      '<optgroup label="调度队列">' +
        queues
          .map((item) => {
            const value = "queue:" + item.uid;
            const selected = value === current ? " selected" : "";
            return '<option value="' + escapeHtml(value) + '"' + selected + ">队列 - " + escapeHtml(schedQueueName(item)) + "</option>";
          })
          .join("") +
        "</optgroup>"
    );
  }
  if (scripts.length) {
    groups.push(
      '<optgroup label="单个脚本">' +
        scripts
          .map((item) => {
            const value = "script:" + item.uid;
            const selected = value === current ? " selected" : "";
            const extra = item.typeLabel || item.type || "";
            const label = "脚本 - " + (item.name || item.uid) + (extra ? " - " + extra : "");
            return '<option value="' + escapeHtml(value) + '"' + selected + ">" + escapeHtml(label) + "</option>";
          })
          .join("") +
        "</optgroup>"
    );
  }
  elements.schedTarget.innerHTML = groups.length
    ? groups.join("")
    : '<option value="">没有可用的托管项或队列</option>';
  if (elements.schedTargetHint) {
    elements.schedTargetHint.textContent =
      state.schedSource === "queue" ? "按队列里的任务顺序依次跑" : "只跑这一个脚本，账号在下面勾";
  }
  const isQueue = state.schedSource === "queue";
  if (elements.schedResumeField) elements.schedResumeField.classList.toggle("is-hidden", !isQueue);
  if (elements.schedResume) {
    const keep = elements.schedResume.value;
    const rows = state.schedScopeItems || [];
    const opts = ['<option value="">（默认：从第一个开始）</option>'];
    rows.forEach((row) => {
      const selected = row.scriptId === keep ? " selected" : "";
      opts.push(
        '<option value="' + escapeHtml(row.scriptId) + '"' + selected + ">" +
          escapeHtml(row.scriptName || schedScriptName(row.scriptId)) +
          "</option>"
      );
    });
    elements.schedResume.innerHTML = opts.join("");
  }
  renderSchedModes();
}

function schedScriptOf() {
  const list = schedScriptList();
  if (state.schedScriptId && list.some((item) => item.uid === state.schedScriptId)) {
    return state.schedScriptId;
  }
  return list.length ? list[0].uid : "";
}


function schedUsableUsers() {
  return schedScopeUsers().filter((user) => user.status !== false);
}

function schedPickedIds() {
  if (state.schedSelectedUsers === null) return schedUsableUsers().map((user) => user.uid);
  return state.schedSelectedUsers.slice();
}

function schedEmptyHint() {
  if (state.schedSource !== "queue") return "这个托管项下还没有账号。";
  if (!state.schedQueueId) return "先在上面选一个调度队列。";
  return "这个队列里的任务项还没选托管项，先去「队列」页给它们选上。";
}
function renderSchedUsers() {
  if (!elements.schedUsers) return;
  if (state.schedScopeLoading) {
    elements.schedUsers.innerHTML = '<p class="hint">正在读托管项与账号…</p>';
    if (elements.schedScopeCount) elements.schedScopeCount.textContent = "";
    return;
  }
  const rows = schedScopeRows();
  const picked = schedPickedIds();
  const total = rows.reduce((sum, row) => sum + (row.users || []).length, 0);
  if (!total) {
    elements.schedUsers.innerHTML = '<p class="hint">' + escapeHtml(schedEmptyHint()) + "</p>";
  } else {
    const multi = rows.length > 1;
    elements.schedUsers.innerHTML = rows
      .map((row) => {
        const chips = (row.users || [])
          .map((user) => {
            const usable = user.status !== false;
            const checked = usable && picked.includes(user.uid) ? " checked" : "";
            const disabled = usable ? "" : " disabled";
            const suffix = usable ? "" : "（未启用）";
            return (
              '<label class="sched-user' + (usable ? "" : " is-off") + '">' +
              '<input type="checkbox" data-sched-user="' + escapeHtml(user.uid) + '"' + checked + disabled + ">" +
              "<span>" + escapeHtml(user.name || user.uid) + suffix + "</span>" +
              "</label>"
            );
          })
          .join("");
        const head = multi
          ? '<span class="sched-scope-name">' + escapeHtml(row.scriptName || schedScriptName(row.scriptId)) + "</span>"
          : "";
        return '<div class="sched-scope-group">' + head + chips + "</div>";
      })
      .join("");
  }
  if (elements.schedScopeCount) {
    const usable = schedUsableUsers();
    elements.schedScopeCount.textContent = usable.length ? "已选 " + picked.length + "/" + usable.length : "";
  }
}
function schedUserSpan(user) {
  return (
    '<span class="sched-user ' + schedStatusClass(user.status) + '">' +
    escapeHtml(user.name || "账号") + " · " + escapeHtml(schedStatusText(user.status)) +
    "</span>"
  );
}

function schedTaskBlock(task) {
  const taskId = String(task.taskId || "");
  const openLogs = state.schedOpenLogs || [];
  const logOpen = openLogs.includes(taskId);
  const flags = [];
  if (task.isCycle) flags.push('<span class="sched-flag">循环</span>');
  if (task.stopping) flags.push('<span class="sched-flag is-danger">停止中</span>');
  const scripts = (task.taskInfo || [])
    .map((script) => {
      const users = (script.users || []).map(schedUserSpan).join("");
      return (
        '<div class="sched-script">' +
        '<div class="sched-script-head">' +
        "<span>" + escapeHtml(script.name || schedScriptName(script.scriptId)) + "</span>" +
        '<span class="sched-status ' + schedStatusClass(script.status) + '">' + escapeHtml(schedStatusText(script.status)) + "</span>" +
        "</div>" +
        '<div class="sched-users">' + (users || '<span class="hint">没有账号</span>') + "</div>" +
        "</div>"
      );
    })
    .join("");
  const cycle = (task.cycleNext || [])
    .map((item) => {
      const meta = [];
      if (item.nextRunAt) meta.push(isoToLocalText(item.nextRunAt));
      if (item.isDue) meta.push("已到点");
      if (item.isRunning) meta.push("运行中");
      return (
        "<li><span>" + escapeHtml(item.scriptName || schedScriptName(item.scriptId)) + "</span>" +
        '<span class="hint">' + escapeHtml(meta.join(" · ")) + "</span></li>"
      );
    })
    .join("");
  const log = task.log || "";
  return (
    '<article class="sched-task">' +
    '<header class="sched-task-head">' +
    '<span class="sched-task-main">' +
    '<span class="sched-task-title">' + escapeHtml(MODE_LABELS[task.mode] || task.mode || "任务") + "</span>" +
    flags.join("") +
    "</span>" +
    '<span class="head-actions">' +
    (log ? '<button class="mini-button" data-sched-log="' + escapeHtml(taskId) + '" type="button">' + (logOpen ? "收起日志" : "日志") + "</button>" : "") +
    '<button class="mini-button is-danger" data-sched-stop="' + escapeHtml(taskId) + '" type="button">停止</button>' +
    "</span>" +
    "</header>" +
    '<div class="sched-scripts">' + (scripts || '<p class="hint">刚提交，状态还没回来。</p>') + "</div>" +
    (cycle ? '<ul class="sched-cycle">' + cycle + "</ul>" : "") +
    (log ? '<pre class="sched-log' + (logOpen ? "" : " is-hidden") + '" data-sched-logbox="' + escapeHtml(taskId) + '">' + escapeHtml(log) + "</pre>" : "") +
    "</article>"
  );
}

function renderSchedTasks(force) {
  if (!elements.schedTasks) return;
  const tasks = state.schedTasks || [];
  const sig = JSON.stringify(tasks);
  if (!force && sig === state.schedSigTasks) return;
  state.schedSigTasks = sig;
  if (!tasks.length) {
    elements.schedTasks.innerHTML = '<p class="hint">现在没有在跑的任务。左边选好托管项和账号，点「开始执行」。</p>';
    if (elements.schedTitle) elements.schedTitle.textContent = "运行中";
    return;
  }
  elements.schedTasks.innerHTML = tasks.map(schedTaskBlock).join("");
  if (elements.schedTitle) elements.schedTitle.textContent = "运行中 " + tasks.length;
  (state.schedOpenLogs || []).forEach((taskId) => {
    const box = elements.schedTasks.querySelector('[data-sched-logbox="' + taskId + '"]');
    if (box) box.scrollTop = box.scrollHeight;
  });
}

function renderSchedScheduled(force) {
  if (!elements.schedScheduled) return;
  const list = state.schedScheduled || [];
  const sig = JSON.stringify(list);
  if (!force && sig === state.schedSigScheduled) return;
  state.schedSigScheduled = sig;
  elements.schedScheduled.innerHTML = list.length
    ? list
        .map((item) =>
          "<li><span>" + escapeHtml(schedScriptName(item.scriptId)) + "</span>" +
          '<span class="hint">' + escapeHtml(item.scriptType || "") + "</span></li>",
        )
        .join("")
    : '<li class="hint">没有托管项开着定时队列。</li>';
}

function schedPowerLabel(signal) {
  const hit = (state.schedPowerOptions || []).find((item) => item.value === signal);
  if (hit) return hit.label || hit.value || "不操作";
  return signal || "不操作";
}

function renderSchedPower(force) {
  if (!elements.schedPowerBox) return;
  const options = state.schedPowerOptions || [];
  const power = state.schedPower || {};
  const current = power.signal || "NoAction";
  const sig = JSON.stringify([options, power]);
  if (!force && sig === state.schedSigPower) return;
  state.schedSigPower = sig;
  if (options.length) {
    elements.schedPowerBox.innerHTML = options
      .map((item) =>
        '<option value="' + escapeHtml(item.value) + '"' + (item.value === current ? " selected" : "") + ">" +
        escapeHtml(item.label || item.value) + "</option>",
      )
      .join("");
  }
  if (!elements.schedCountdown) return;
  const countdown = power.countdown || {};
  if (countdown && countdown.active) {
    elements.schedCountdown.textContent =
      "「" + schedPowerLabel(countdown.operation) + "」将在 " + countdown.remaining + " 秒后执行，点「取消倒计时」可以拦下来。";
    elements.schedCountdown.classList.remove("is-hidden");
    return;
  }
  elements.schedCountdown.textContent = current && current !== "NoAction"
    ? "所有任务跑完后会执行「" + schedPowerLabel(current) + "」。"
    : "所有任务跑完后什么都不做。";
}

function renderScheduler(force) {
  renderSchedTargets();
  renderSchedUsers();
  renderSchedTasks(force === undefined ? true : force);
  renderSchedScheduled(force === undefined ? true : force);
  renderSchedPower(force === undefined ? true : force);
}

async function loadSchedScope(force) {
  if (!state.schedScopeCache) state.schedScopeCache = {};
  const key = schedTargetValue();
  state.schedSelectedUsers = null;
  const cached = force ? null : state.schedScopeCache[key];
  if (cached) {
    state.schedScopeLoading = false;
    if (state.schedSource === "queue") state.schedScopeItems = cached.items || [];
    else state.schedUsers = cached.users || [];
    renderSchedTargets();
    renderSchedUsers();
    return;
  }
  state.schedScopeLoading = true;
  if (state.schedSource === "queue") {
    const queueId = state.schedQueueId || schedQueueOf();
    state.schedQueueId = queueId;
    state.schedScopeItems = [];
    renderSchedUsers();
    if (queueId) {
      try {
        const data = await callApi("scheduler/scope", { queueId: queueId });
        state.schedScopeItems = data.items || [];
        state.schedScopeCache["queue:" + queueId] = { items: state.schedScopeItems };
      } catch (error) {
        state.schedScopeItems = [];
        setError(error.message);
      }
    }
    state.schedScopeLoading = false;
    renderSchedTargets();
    renderSchedUsers();
    return;
  }
  const scriptId = state.schedScriptId || schedScriptOf();
  state.schedScriptId = scriptId;
  state.schedUsers = [];
  if (!scriptId) {
    state.schedScopeLoading = false;
    renderSchedUsers();
    return;
  }
  renderSchedUsers();
  try {
    const data = await callApi("users", { scriptId: scriptId });
    state.schedUsers = data.users || [];
    state.schedScopeCache["script:" + scriptId] = { users: state.schedUsers };
  } catch (error) {
    state.schedUsers = [];
    setError(error.message);
  }
  state.schedScopeLoading = false;
  renderSchedTargets();
  renderSchedUsers();
}
async function loadScheduler(options) {
  const silent = Boolean(options && options.silent);
  if (!schedScriptList().length) {
    try {
      await loadOverview();
    } catch (error) {
      if (!silent) setError(error.message);
    }
  }
  try {
    const data = await callApi("scheduler", {});
    state.schedTasks = data.tasks || [];
    state.schedScheduled = data.scheduled || [];
    state.schedPower = data.power || {};
    state.schedPowerOptions = data.powerOptions || [];
    state.schedQueues = data.queues || [];
    renderSchedTargets();
    if (!schedScopeUsers().length) await loadSchedScope();
    renderScheduler(true);
  } catch (error) {
    if (!silent) setError(error.message);
  }
}

async function pollScheduler() {
  try {
    const data = await callApi("scheduler/running", {});
    state.schedTasks = data.tasks || [];
    state.schedScheduled = data.scheduled || [];
    state.schedPower = data.power || {};
    renderSchedTasks(false);
    renderSchedScheduled(false);
    renderSchedPower(false);
  } catch (error) {
    stopSchedPolling();
  }
}

function startSchedPolling() {
  stopSchedPolling();
  state.schedTimer = setInterval(() => {
    if (state.view !== "scheduler") {
      stopSchedPolling();
      return;
    }
    pollScheduler();
  }, 3000);
}

function stopSchedPolling() {
  if (state.schedTimer) {
    clearInterval(state.schedTimer);
    state.schedTimer = null;
  }
}

async function schedStart() {
  if (state.busy) return;
  if (state.schedScopeLoading) {
    showToast("还在读账号列表，稍等一下。", true);
    return;
  }
  const mode = elements.schedMode ? elements.schedMode.value : "AutoProxy";
  const picked = schedPickedIds();
  const payload = { mode: mode };
  if (state.schedSource === "queue") {
    const queueId = state.schedQueueId || schedQueueOf();
    if (!queueId) {
      showToast("先选一个调度队列。", true);
      return;
    }
    const rows = schedScopeRows();
    if (!rows.length) {
      showToast("这个队列里的任务项还没选托管项。", true);
      return;
    }
    // 每个脚本都列进去：勾了谁就只跑谁，一个没勾的脚本写空数组＝这次整项跳过。
    const queueUserIds = {};
    let pickedTotal = 0;
    rows.forEach((row) => {
      const usable = (row.users || []).filter((user) => user.status !== false);
      const hit = picked.filter((uid) => usable.some((user) => user.uid === uid));
      queueUserIds[row.scriptId] = hit;
      pickedTotal += hit.length;
    });
    if (!pickedTotal) {
      showToast("至少勾一个账号。", true);
      return;
    }
    payload.taskId = queueId;
    payload.queueUserIds = queueUserIds;
    const resume = elements.schedResume ? elements.schedResume.value : "";
    if (resume) payload.resumeFromScriptId = resume;
  } else {
    const scriptId = schedScriptOf();
    if (!scriptId) {
      showToast("先选一个托管项。", true);
      return;
    }
    const usable = schedUsableUsers();
    const hit = picked.filter((uid) => usable.some((user) => user.uid === uid));
    if (mode !== "Update" && !usable.length) {
      showToast("这个托管项下没有可运行的账号。", true);
      return;
    }
    if (mode !== "Update" && !hit.length) {
      showToast("至少勾一个账号。", true);
      return;
    }
    payload.scriptId = scriptId;
    if (hit.length) payload.userIds = hit;
  }
  state.busy = true;
  try {
    await postApi("dispatch/start", payload);
    showToast("任务已提交。");
    await loadScheduler({ silent: true });
  } catch (error) {
    setError(error.message);
  } finally {
    state.busy = false;
  }
}

async function schedStop(taskId) {
  if (!taskId) return;
  try {
    await postApi("dispatch/stop", { taskId: taskId });
    showToast("已发送停止。");
    await loadScheduler({ silent: true });
  } catch (error) {
    setError(error.message);
  }
}

async function schedPowerApply() {
  const signal = elements.schedPowerBox ? elements.schedPowerBox.value : "";
  if (!signal) return;
  try {
    await postApi("scheduler/power", { signal: signal });
    state.schedPower = { signal: signal, countdown: (state.schedPower || {}).countdown || {} };
    renderSchedPower(true);
    showToast(signal === "NoAction" ? "已关掉电源操作。" : "记下了，任务跑完就执行。");
  } catch (error) {
    setError(error.message);
  }
}

async function schedPowerCancel() {
  try {
    await postApi("scheduler/power/cancel", {});
    showToast("倒计时已取消。");
  } catch (error) {
    showToast("现在没有正在倒计时的电源操作。", true);
  }
  await loadScheduler({ silent: true });
}

function onSchedTasksClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const stop = target.closest("[data-sched-stop]");
  if (stop) {
    schedStop(stop.getAttribute("data-sched-stop"));
    return;
  }
  const logBtn = target.closest("[data-sched-log]");
  if (!logBtn) return;
  const taskId = logBtn.getAttribute("data-sched-log");
  const box = elements.schedTasks.querySelector('[data-sched-logbox="' + taskId + '"]');
  if (!box) return;
  const opened = box.classList.toggle("is-hidden") === false;
  const kept = (state.schedOpenLogs || []).filter((item) => item !== taskId);
  if (opened) kept.push(taskId);
  state.schedOpenLogs = kept;
  logBtn.textContent = opened ? "收起日志" : "日志";
  if (opened) box.scrollTop = box.scrollHeight;
}

function onSchedUserToggle(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  const uid = target.getAttribute("data-sched-user");
  if (!uid) return;
  const picked = schedPickedIds().filter((item) => item !== uid);
  if (target.checked) picked.push(uid);
  state.schedSelectedUsers = picked;
  renderSchedUsers();
}

function selectAllSchedUsers(all) {
  state.schedSelectedUsers = all ? null : [];
  renderSchedUsers();
}

// ---- 计划表 ----

const WEEK_KEYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const PLAN_ROW_LABELS = {
  ALL: "全局默认",
  Monday: "周一",
  Tuesday: "周二",
  Wednesday: "周三",
  Thursday: "周四",
  Friday: "周五",
  Saturday: "周六",
  Sunday: "周日",
};

const PLAN_FIELDS = [
  { key: "Stage", label: "关卡", kind: "stage" },
  { key: "Stage_1", label: "备选1", kind: "stage" },
  { key: "Stage_2", label: "备选2", kind: "stage" },
  { key: "Stage_3", label: "备选3", kind: "stage" },
  { key: "SeriesNumb", label: "连战", kind: "series" },
  { key: "MedicineNumb", label: "理智药", kind: "number" },
];

const PLAN_MODES = [
  ["Weekly", "按星期"],
  ["ALL", "轮换"],
];

async function loadPlans() {
  try {
    const data = await callApi("plans");
    state.plans = data.plans || [];
    setError("");
  } catch (error) {
    state.plans = [];
    setError(error.message);
  }
  renderPlanList();
}

function renderPlanList() {
  const plans = state.plans || [];
  if (!plans.length) {
    elements.planList.innerHTML = '<li class="empty">还没有计划表，点右上角「+ 新建」。</li>';
    return;
  }
  elements.planList.innerHTML = plans
    .map((plan) => {
      const active = plan.uid === state.selectedPlan ? " is-active" : "";
      const meta = plan.mode ? plan.type + " · " + plan.mode : plan.type;
      return (
        '<li class="script-item' + active + '" data-plan="' + escapeHtml(plan.uid) + '">' +
        '<div class="script-name">' + escapeHtml(plan.name) + "</div>" +
        '<div class="script-meta">' + escapeHtml(meta) + "</div></li>"
      );
    })
    .join("");
  elements.planList.querySelectorAll("[data-plan]").forEach((node) => {
    node.addEventListener("click", () => openPlan(node.dataset.plan));
  });
}

async function openPlan(planId) {
  state.selectedPlan = planId;
  renderPlanList();
  try {
    const data = await postApi("plan/detail", { planId });
    state.editingPlan = { planId, data: data.config || {} };
  } catch (error) {
    state.editingPlan = null;
    setError(error.message);
  }
  renderPlanEditor();
}

function planRows(data) {
  const rows = [{ key: "ALL", label: PLAN_ROW_LABELS.ALL }];
  const hasWeek = WEEK_KEYS.some((key) => data[key] && typeof data[key] === "object");
  if (hasWeek) {
    WEEK_KEYS.forEach((key) => rows.push({ key, label: PLAN_ROW_LABELS[key] }));
  }
  const rotate = Number((data.Info || {}).RotateDays) || 0;
  const total = Math.min(Math.max(rotate, 0), 31);
  for (let index = 1; index <= total; index += 1) {
    rows.push({ key: "Day" + index, label: "第 " + index + " 天" });
  }
  return rows;
}

function planCell(item, field) {
  const attrs = 'data-key="' + field.key + '"';
  const raw = item[field.key];
  if (field.kind === "series") {
    return (
      '<select class="plan-input" ' + attrs + ">" +
      selectOptions(SERIES_OPTIONS, String(raw == null ? "0" : raw)) +
      "</select>"
    );
  }
  if (field.kind === "number") {
    return (
      '<input class="plan-input" type="number" min="0" ' + attrs +
      ' value="' + escapeHtml(raw == null ? 0 : raw) + '" />'
    );
  }
  return (
    '<select class="plan-input" ' + attrs + ' data-stage="1">' + stageOptionsHtml(raw) + "</select>"
  );

}

function renderPlanEditor() {
  const editing = state.editingPlan;
  if (!editing) {
    elements.planTitle.textContent = "选一个计划表";
    elements.planSave.classList.add("is-hidden");
    elements.planDelete.classList.add("is-hidden");
    elements.planEditor.innerHTML = '<p class="empty">左边选一个计划表，或者点「+ 新建」。</p>';
    return;
  }
  const data = editing.data;
  if (!data.Info || typeof data.Info !== "object") data.Info = {};
  const info = data.Info;
  elements.planTitle.textContent = info.Name || editing.planId;
  elements.planSave.classList.remove("is-hidden");
  elements.planDelete.classList.remove("is-hidden");

  const parts = ['<div class="plan-head">'];
  parts.push(
    '<label class="field"><span>名称</span><input id="plan-name" type="text" value="' +
      escapeHtml(info.Name || "") + '" /></label>',
  );
  parts.push(
    '<label class="field"><span>模式</span><select id="plan-mode">' +
      selectOptions(PLAN_MODES, String(info.Mode || "Weekly")) +
      "</select></label>",
  );
  parts.push(
    '<label class="field"><span>轮换天数</span><input id="plan-rotate" type="number" min="0" max="31" value="' +
      escapeHtml(info.RotateDays == null ? 0 : info.RotateDays) + '" /></label>',
  );
  parts.push("</div>");

  const rows = planRows(data);
  const table = ['<table class="plan-table"><thead><tr><th>日程</th>'];
  PLAN_FIELDS.forEach((field) => table.push("<th>" + field.label + "</th>"));
  table.push("</tr></thead><tbody>");
  rows.forEach((row) => {
    if (!data[row.key] || typeof data[row.key] !== "object") data[row.key] = {};
    const item = data[row.key];
    table.push('<tr data-row="' + row.key + '"><td class="plan-row-label">' + row.label + "</td>");
    PLAN_FIELDS.forEach((field) => table.push("<td>" + planCell(item, field) + "</td>"));
    table.push("</tr>");
  });
  table.push("</tbody></table>");
  elements.planEditor.innerHTML = parts.join("") + table.join("");

  elements.planEditor.querySelectorAll("tr[data-row] [data-key]").forEach((node) => {
    node.addEventListener("change", () => commitPlanCell(node));
  });
  const nameInput = document.getElementById("plan-name");
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      info.Name = nameInput.value;
      elements.planTitle.textContent = info.Name || editing.planId;
    });
  }
  const modeInput = document.getElementById("plan-mode");
  if (modeInput) {
    modeInput.addEventListener("change", () => {
      info.Mode = modeInput.value;
      renderPlanEditor();
    });
  }
  const rotateInput = document.getElementById("plan-rotate");
  if (rotateInput) {
    rotateInput.addEventListener("change", () => {
      info.RotateDays = Number(rotateInput.value || 0);
      renderPlanEditor();
    });
  }
}

function commitPlanCell(node) {
  if (node.dataset && node.dataset.stage === "1") {
    if (node.value === "__custom") {
      const code = String(window.prompt("输入关卡代码（例如 AT-6、LS-6）", "") || "").trim();
      if (!code) {
        node.value = node.dataset.prev || "";
        return;
      }
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = code + "（自定义）";
      node.insertBefore(opt, node.lastElementChild);
      node.value = code;
      node.dataset.prev = code;
    } else {
      node.dataset.prev = node.value;
    }
  }
  const row = node.closest("tr[data-row]");
  if (!row || !state.editingPlan) return;
  const data = state.editingPlan.data;
  const key = row.dataset.row;
  if (!data[key] || typeof data[key] !== "object") data[key] = {};
  const field = node.dataset.key;
  if (node.type === "number") {
    data[key][field] = Number(node.value || 0);
  } else {
    data[key][field] = node.value;
  }
}

async function savePlan() {
  if (!state.editingPlan) return;
  const { planId, data } = state.editingPlan;
  try {
    await postApi("plan/save", { planId, data });
    showToast("计划表已保存");
    await loadPlans();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function createPlan() {
  const answer = window.prompt("计划表类型：MaaPlan 或 MaaEndPlan", "MaaPlan");
  if (answer === null) return;
  const type = answer.trim() === "MaaEndPlan" ? "MaaEndPlan" : "MaaPlan";
  try {
    const created = await postApi("plan/create", { type });
    showToast("已新建计划表");
    await loadPlans();
    if (created && created.planId) await openPlan(created.planId);
  } catch (error) {
    showToast(error.message, true);
  }
}

async function deletePlan() {
  if (!state.editingPlan) return;
  if (!window.confirm("删除这个计划表？删了就找不回来了。")) return;
  try {
    await postApi("plan/delete", { planId: state.editingPlan.planId });
    state.editingPlan = null;
    state.selectedPlan = null;
    renderPlanEditor();
    await loadPlans();
    showToast("已删除");
  } catch (error) {
    showToast(error.message, true);
  }
}

// ---- 调度队列 ----

const QUEUE_STARTUP_MODES = [
  ["Never", "从不"],
  ["Always", "总是"],
  ["DailyFirst", "每天首次"],
];

const QUEUE_AFTER_ACTIONS = [
  ["NoAction", "不操作"],
  ["Shutdown", "关机"],
  ["ShutdownForce", "强制关机"],
  ["Reboot", "重启"],
  ["Hibernate", "休眠"],
  ["Sleep", "睡眠"],
  ["KillSelf", "退出 AUTO-MAS"],
  ["RestartSelf", "重启 AUTO-MAS"],
  ["Logoff", "注销"],
];

const QUEUE_SCHEDULE_MODES = [
  ["fixed_time", "固定时间"],
  ["interval", "间隔运行"],
];

const QUEUE_INTERVAL_ANCHORS = [
  ["start", "从开始算"],
  ["finish", "从结束算"],
];

const QUEUE_ZERO_TIME = "1999-12-31T16:00:00Z";

function pad2(value) {
  const number = Number(value) || 0;
  return number < 10 ? "0" + number : String(number);
}

function isoToHm(iso) {
  if (!iso) return "00:00";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "00:00";
  return pad2(date.getHours()) + ":" + pad2(date.getMinutes());
}

function hmToIso(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || "").trim());
  const hour = match ? Number(match[1]) : 0;
  const minute = match ? Number(match[2]) : 0;
  return new Date(2000, 0, 1, hour, minute, 0, 0).toISOString().replace(".000Z", "Z");
}

function isoToLocalText(iso) {
  if (!iso) return "未排期";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "未排期";
  if (date.getFullYear() < 2000) return "未排期";
  return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate()) + " " + pad2(date.getHours()) + ":" + pad2(date.getMinutes());
}

function dayChips(days, group) {
  const picked = Array.isArray(days) ? days : [];
  const cells = WEEKDAY_OPTIONS.map((pair) => {
    const checked = picked.indexOf(pair[0]) >= 0 ? " checked" : "";
    return "<label class=\"day-chip\"><input type=\"checkbox\" value=\"" + pair[0] + "\" data-group=\"" + group + "\" data-key=\"days\"" + checked + "><span>" + pair[1] + "</span></label>";
  });
  return "<div class=\"day-chips\">" + cells.join("") + "</div>";
}

function queueSelect(options, current, group, key) {
  const known = options.some((pair) => String(pair[0]) === String(current));
  const body = options
    .map((pair) => {
      const selected = String(pair[0]) === String(current) ? " selected" : "";
      return "<option value=\"" + escapeHtml(pair[0]) + "\"" + selected + ">" + escapeHtml(pair[1]) + "</option>";
    })
    .join("");
  const unknown = known || current === undefined || current === null || current === ""
    ? ""
    : "<option value=\"" + escapeHtml(current) + "\" selected>" + escapeHtml(current) + "</option>";
  return "<select data-group=\"" + group + "\" data-key=\"" + key + "\">" + unknown + body + "</select>";
}

function queueField(label, control) {
  return "<div class=\"queue-field\"><span class=\"queue-label\">" + label + "</span>" + control + "</div>";
}

function queueInfoPayload(info) {
  const source = info || {};
  return {
    Name: String(source.Name || ""),
    TimeEnabled: source.TimeEnabled === true,
    StartUpMode: source.StartUpMode || "Never",
    AfterAccomplish: source.AfterAccomplish || "NoAction",
    AfterAccomplishDelay: Number(source.AfterAccomplishDelay || 0) || 0,
    CycleEnabled: source.CycleEnabled === true,
    IfScriptBeforeTask: source.IfScriptBeforeTask === true,
    ScriptBeforeTask: source.ScriptBeforeTask ? String(source.ScriptBeforeTask) : null,
    IfScriptAfterTask: source.IfScriptAfterTask === true,
    ScriptAfterTask: source.ScriptAfterTask ? String(source.ScriptAfterTask) : null,
  };
}

function queueSchedulePayload(schedule) {
  const source = schedule || {};
  return {
    Mode: source.Mode === "interval" ? "interval" : "fixed_time",
    Time: source.Time || QUEUE_ZERO_TIME,
    Days: Array.isArray(source.Days) && source.Days.length ? source.Days : WEEK_KEYS,
    IntervalMinutes: Number(source.IntervalMinutes || 480) || 480,
    IntervalAnchor: source.IntervalAnchor === "finish" ? "finish" : "start",
    Enabled: source.Enabled !== false,
  };
}

function queueTimePayload(info) {
  const source = info || {};
  return {
    Enabled: source.Enabled !== false,
    Days: Array.isArray(source.Days) && source.Days.length ? source.Days : WEEK_KEYS,
    Time: source.Time || QUEUE_ZERO_TIME,
  };
}

async function loadQueues() {
  try {
    const data = await callApi("queues");
    state.queues = data.queues || [];
    setError("");
  } catch (error) {
    state.queues = [];
    setError(error.message);
  }
  renderQueueList();
}

function renderQueueList() {
  if (!state.queues.length) {
    elements.queueList.innerHTML = "<li class=\"empty\">一个调度队列都没有。</li>";
    return;
  }
  elements.queueList.innerHTML = state.queues
    .map((queue) => {
      const active = queue.uid === state.selectedQueue ? " is-active" : "";
      const badge = queue.timeEnabled ? "<div class=\"script-meta\">已开启定时</div>" : "<div class=\"script-meta\">手动触发</div>";
      return "<li class=\"script-item" + active + "\" data-queue=\"" + escapeHtml(queue.uid) + "\"><div class=\"script-name\">" + escapeHtml(queue.name) + "</div>" + badge + "</li>";
    })
    .join("");
  elements.queueList.querySelectorAll(".script-item").forEach((node) => {
    node.addEventListener("click", () => openQueue(node.dataset.queue));
  });
  if (state.selectedQueue) {
    const current = state.queues.find((item) => item.uid === state.selectedQueue);
    if (current) elements.queueTitle.textContent = "队列：" + current.name;
  }
}

async function openQueue(queueId) {
  state.selectedQueue = queueId;
  state.queueDetail = null;
  renderQueueList();
  const queue = state.queues.find((item) => item.uid === queueId);
  elements.queueTitle.textContent = queue ? "队列：" + queue.name : "队列";
  [elements.queueRun, elements.queueDelete, elements.queueSave].forEach((node) => {
    if (node) node.classList.remove("is-hidden");
  });
  await refreshQueueDetail(queueId);
}

async function refreshQueueDetail(queueId) {
  try {
    const data = await postApi("queue/detail", { queueId: queueId });
    state.queueDetail = data;
    setError("");
  } catch (error) {
    state.queueDetail = null;
    setError(error.message);
  }
  renderQueueEditor();
}

function queueItemBlock(item, index, scripts) {
  const schedule = item.schedule || {};
  const mode = schedule.Mode === "interval" ? "interval" : "fixed_time";
  const fixedHidden = mode === "fixed_time" ? "" : " is-hidden";
  const intervalHidden = mode === "interval" ? "" : " is-hidden";
  const options = ["<option value=\"\">未选择脚本</option>"]
    .concat(
      scripts.map((script) => {
        const selected = script.uid === item.scriptId ? " selected" : "";
        return "<option value=\"" + escapeHtml(script.uid) + "\"" + selected + ">" + escapeHtml(script.name) + "</option>";
      }),
    )
    .join("");
  return "<div class=\"queue-item\" data-item=\"" + escapeHtml(item.uid) + "\">"
    + "<span class=\"queue-index\">" + (index + 1) + "</span>"
    + "<div class=\"queue-item-main\">"
    + "<select class=\"queue-script\" data-group=\"item\" data-key=\"scriptId\">" + options + "</select>"
    + "<div class=\"queue-item-sub\">"
    + queueSelect(QUEUE_SCHEDULE_MODES, mode, "item", "mode")
    + "<input class=\"qm-fixed" + fixedHidden + "\" type=\"time\" data-group=\"item\" data-key=\"time\" value=\"" + isoToHm(schedule.Time) + "\">"
    + "<span class=\"qm-interval" + intervalHidden + "\"><input type=\"number\" min=\"1\" step=\"1\" data-group=\"item\" data-key=\"interval\" value=\"" + (Number(schedule.IntervalMinutes || 480) || 480) + "\"> 分钟</span>"
    + queueSelect(QUEUE_INTERVAL_ANCHORS, schedule.IntervalAnchor || "start", "item", "anchor")
    + "</div>"
    + "<div class=\"queue-item-sub\">"
    + dayChips(schedule.Days, "item")
    + "<label class=\"check-line\"><input type=\"checkbox\" data-group=\"item\" data-key=\"enabled\"" + (schedule.Enabled !== false ? " checked" : "") + "><span>启用</span></label>"
    + "<span class=\"queue-next\">" + (schedule.Mode === "interval" ? "" : "") + "</span>"
    + "</div>"
    + "</div>"
    + "<span class=\"queue-actions\">"
    + "<button class=\"mini-button\" type=\"button\" data-qi-up><i class=&quot;mdi mdi-arrow-up&quot;></i></button>"
    + "<button class=\"mini-button\" type=\"button\" data-qi-down><i class=&quot;mdi mdi-arrow-down&quot;></i></button>"
    + "<button class=\"mini-button is-danger\" type=\"button\" data-qi-del><i class=&quot;mdi mdi-delete-outline&quot;></i> 删除</button>"
    + "</span>"
    + "</div>";
}

function queueTimeBlock(entry) {
  const info = entry.info || {};
  return "<div class=\"queue-time\" data-time=\"" + escapeHtml(entry.uid) + "\">"
    + "<input type=\"time\" data-group=\"time\" data-key=\"Time\" value=\"" + isoToHm(info.Time) + "\">"
    + dayChips(info.Days, "time")
    + "<label class=\"check-line\"><input type=\"checkbox\" data-group=\"time\" data-key=\"Enabled\"" + (info.Enabled !== false ? " checked" : "") + "><span>启用</span></label>"
    + "<button class=\"mini-button is-danger\" type=\"button\" data-qt-del><i class=&quot;mdi mdi-delete-outline&quot;></i> 删除</button>"
    + "</div>";
}

function queueInfoBlock(info) {
  const rows = [];
  rows.push(queueField("队列名", "<input type=\"text\" data-group=\"info\" data-key=\"Name\" value=\"" + escapeHtml(info.Name || "") + "\">"));
  rows.push(queueField("启动模式", queueSelect(QUEUE_STARTUP_MODES, info.StartUpMode || "Never", "info", "StartUpMode")));
  rows.push(queueField("全部完成后", queueSelect(QUEUE_AFTER_ACTIONS, info.AfterAccomplish || "NoAction", "info", "AfterAccomplish")));
  rows.push(queueField("动作延迟(秒)", "<input type=\"number\" min=\"0\" data-group=\"info\" data-key=\"AfterAccomplishDelay\" value=\"" + (Number(info.AfterAccomplishDelay || 0) || 0) + "\">"));
  rows.push(queueField("定时提醒", "<label class=\"check-line\"><input type=\"checkbox\" data-group=\"info\" data-key=\"TimeEnabled\"" + (info.TimeEnabled === true ? " checked" : "") + "><span>到点提醒</span></label>"));
  rows.push(queueField("循环运行", "<label class=\"check-line\"><input type=\"checkbox\" data-group=\"info\" data-key=\"CycleEnabled\"" + (info.CycleEnabled === true ? " checked" : "") + "><span>跑完从头循环</span></label>"));
  rows.push(queueField("任务前脚本", "<div class=\"queue-stack\"><label class=\"check-line\"><input type=\"checkbox\" data-group=\"info\" data-key=\"IfScriptBeforeTask\"" + (info.IfScriptBeforeTask === true ? " checked" : "") + "><span>启用</span></label><input type=\"text\" data-group=\"info\" data-key=\"ScriptBeforeTask\" value=\"" + escapeHtml(info.ScriptBeforeTask || "") + "\" placeholder=\"D:/Tools/before.bat\"></div>"));
  rows.push(queueField("任务后脚本", "<div class=\"queue-stack\"><label class=\"check-line\"><input type=\"checkbox\" data-group=\"info\" data-key=\"IfScriptAfterTask\"" + (info.IfScriptAfterTask === true ? " checked" : "") + "><span>启用</span></label><input type=\"text\" data-group=\"info\" data-key=\"ScriptAfterTask\" value=\"" + escapeHtml(info.ScriptAfterTask || "") + "\" placeholder=\"D:/Tools/after.bat\"></div>"));
  return "<div class=\"queue-block\"><div class=\"queue-block-head\"><span>队列设置</span></div><div class=\"queue-grid\">" + rows.join("") + "</div></div>";
}

function renderQueueEditor() {
  const detail = state.queueDetail;
  if (!detail) {
    elements.queueEditor.innerHTML = "<p class=\"empty\">先选左边的队列，或者右上角新建一个。</p>";
    return;
  }
  const info = (detail.config || {}).Info || {};
  const items = detail.items || [];
  const times = detail.times || [];
  const scripts = detail.scripts || [];
  const blocks = [];
  blocks.push(
    "<div class=\"queue-block\"><div class=\"queue-block-head\"><span>任务项（按顺序跑）</span><button class=\"mini-button\" type=\"button\" id=\"qi-add\">+ 加一项</button></div>"
      + (items.length ? items.map((item, index) => queueItemBlock(item, index, scripts)).join("") : "<p class=\"empty\">这个队列还没有任务项。</p>")
      + "</div>",
  );
  blocks.push(
    "<div class=\"queue-block\"><div class=\"queue-block-head\"><span>定时启动（本地时间）</span><button class=\"mini-button\" type=\"button\" id=\"qt-add\">+ 加一个时间</button></div>"
      + (times.length ? times.map(queueTimeBlock).join("") : "<p class=\"empty\">没有定时项，只能手动点「运行」。</p>")
      + "</div>",
  );
  elements.queueEditor.innerHTML = queueInfoBlock(info) + blocks.join("");
}

function commitQueueField(target) {
  const detail = state.queueDetail;
  if (!detail) return;
  const group = target.dataset.group;
  const key = target.dataset.key;
  if (!group || !key) return;
  let value;
  if (key === "days") {
    const box = target.closest(".day-chips");
    value = box ? Array.prototype.slice.call(box.querySelectorAll("input:checked")).map((node) => node.value) : [];
  } else if (target.type === "checkbox") {
    value = target.checked;
  } else if (target.type === "number") {
    value = Number(target.value || 0) || 0;
  } else {
    value = target.value;
  }
  const host = target.closest("[data-item],[data-time]");
  if (group === "info") {
    detail.config = detail.config || {};
    detail.config.Info = detail.config.Info || {};
    detail.config.Info[key] = value;
    persistQueueInfo();
    return;
  }
  if (group === "item" && host && host.dataset.item) {
    const item = (detail.items || []).find((entry) => entry.uid === host.dataset.item);
    if (!item) return;
    item.schedule = item.schedule || {};
    if (key === "scriptId") item.scriptId = value || "-";
    else if (key === "mode") {
      item.schedule.Mode = value;
      toggleQueueMode(host, value);
    } else if (key === "time") item.schedule.Time = hmToIso(value);
    else if (key === "interval") item.schedule.IntervalMinutes = Number(value) || 1;
    else if (key === "anchor") item.schedule.IntervalAnchor = value;
    else if (key === "enabled") item.schedule.Enabled = value;
    else if (key === "days") item.schedule.Days = value;
    persistQueueItem(item);
    return;
  }
  if (group === "time" && host && host.dataset.time) {
    const entry = (detail.times || []).find((row) => row.uid === host.dataset.time);
    if (!entry) return;
    entry.info = entry.info || {};
    if (key === "Time") entry.info.Time = hmToIso(value);
    else if (key === "Enabled") entry.info.Enabled = value;
    else if (key === "days") entry.info.Days = value;
    persistQueueTime(entry);
  }
}

function toggleQueueMode(host, mode) {
  const fixed = host.querySelector(".qm-fixed");
  const interval = host.querySelector(".qm-interval");
  if (fixed) fixed.classList.toggle("is-hidden", mode !== "fixed_time");
  if (interval) interval.classList.toggle("is-hidden", mode !== "interval");
}

async function persistQueueInfo() {
  const detail = state.queueDetail;
  if (!detail) return;
  try {
    await postApi("queue/save", { queueId: detail.queueId, info: queueInfoPayload((detail.config || {}).Info) });
    await loadQueues();
    showToast("队列设置已保存");
  } catch (error) {
    setError(error.message);
    showToast(error.message, true);
  }
}

async function persistQueueItem(item) {
  const detail = state.queueDetail;
  if (!detail) return;
  try {
    await postApi("queue/item/save", {
      queueId: detail.queueId,
      queueItemId: item.uid,
      scriptId: item.scriptId && item.scriptId !== "-" ? item.scriptId : "-",
      schedule: queueSchedulePayload(item.schedule),
    });
    showToast("任务项已保存");
  } catch (error) {
    setError(error.message);
    showToast(error.message, true);
  }
}

async function persistQueueTime(entry) {
  const detail = state.queueDetail;
  if (!detail) return;
  try {
    await postApi("queue/time/save", {
      queueId: detail.queueId,
      timeSetId: entry.uid,
      info: queueTimePayload(entry.info),
    });
    showToast("定时项已保存");
  } catch (error) {
    setError(error.message);
    showToast(error.message, true);
  }
}

async function saveQueue() {
  await persistQueueInfo();
}

async function createQueue() {
  try {
    const data = await postApi("queue/create", {});
    await loadQueues();
    const queueId = data && (data.queueId || data.uid);
    if (queueId) {
      await openQueue(queueId);
    }
    showToast("已新建队列");
  } catch (error) {
    setError(error.message);
    showToast(error.message, true);
  }
}

async function deleteQueue() {
  const detail = state.queueDetail;
  if (!detail) return;
  if (!window.confirm("确定删除这个调度队列？")) return;
  try {
    await postApi("queue/delete", { queueId: detail.queueId });
    state.selectedQueue = null;
    state.queueDetail = null;
    [elements.queueRun, elements.queueDelete, elements.queueSave].forEach((node) => {
      if (node) node.classList.add("is-hidden");
    });
    await loadQueues();
    renderQueueEditor();
    showToast("队列已删除");
  } catch (error) {
    setError(error.message);
    showToast(error.message, true);
  }
}

async function runQueue() {
  const detail = state.queueDetail;
  if (!detail) return;
  try {
    const data = await postApi("queue/run", { queueId: detail.queueId });
    showToast("已提交运行，taskId：" + ((data && data.taskId) || "?"));
    await loadOverview();
  } catch (error) {
    setError(error.message);
    showToast(error.message, true);
  }
}

async function queueItemAdd() {
  const detail = state.queueDetail;
  if (!detail) return;
  try {
    await postApi("queue/item/add", { queueId: detail.queueId });
    await refreshQueueDetail(detail.queueId);
    showToast("已加一项");
  } catch (error) {
    setError(error.message);
    showToast(error.message, true);
  }
}

async function queueItemDelete(itemId) {
  const detail = state.queueDetail;
  if (!detail) return;
  try {
    await postApi("queue/item/delete", { queueId: detail.queueId, queueItemId: itemId });
    await refreshQueueDetail(detail.queueId);
    showToast("任务项已删除");
  } catch (error) {
    setError(error.message);
    showToast(error.message, true);
  }
}

async function queueItemMove(itemId, delta) {
  const detail = state.queueDetail;
  if (!detail) return;
  const items = (detail.items || []).slice();
  const index = items.findIndex((entry) => entry.uid === itemId);
  const next = index + delta;
  if (index < 0 || next < 0 || next >= items.length) return;
  const moved = items.splice(index, 1)[0];
  items.splice(next, 0, moved);
  try {
    await postApi("queue/item/order", {
      queueId: detail.queueId,
      indexList: items.map((entry) => entry.uid),
    });
    await refreshQueueDetail(detail.queueId);
  } catch (error) {
    setError(error.message);
    showToast(error.message, true);
  }
}

async function queueTimeAdd() {
  const detail = state.queueDetail;
  if (!detail) return;
  try {
    await postApi("queue/time/add", { queueId: detail.queueId });
    await refreshQueueDetail(detail.queueId);
    showToast("已加一个定时");
  } catch (error) {
    setError(error.message);
    showToast(error.message, true);
  }
}

async function queueTimeDelete(timeSetId) {
  const detail = state.queueDetail;
  if (!detail) return;
  try {
    await postApi("queue/time/delete", { queueId: detail.queueId, timeSetId: timeSetId });
    await refreshQueueDetail(detail.queueId);
    showToast("定时项已删除");
  } catch (error) {
    setError(error.message);
    showToast(error.message, true);
  }
}

// ---- 运行历史 ----

function dateText(date) {
  return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
}

function todayIso() {
  return dateText(new Date());
}

function daysAgoIso(days) {
  const now = new Date();
  return dateText(new Date(now.getFullYear(), now.getMonth(), now.getDate() - days));
}

function initHistoryRange() {
  if (elements.histEnd && !elements.histEnd.value) elements.histEnd.value = todayIso();
  if (elements.histStart && !elements.histStart.value) elements.histStart.value = daysAgoIso(6);
}

async function loadHistory() {
  initHistoryRange();
  const start = elements.histStart.value || daysAgoIso(6);
  const end = elements.histEnd.value || todayIso();
  const mode = elements.histMode.value || "DAILY";
  elements.histBody.innerHTML = "<p class=\"empty\">查询中…</p>";
  try {
    const data = await postApi("history/search", { startDate: start, endDate: end, mode: mode });
    state.histDays = data.days || [];
    setError("");
  } catch (error) {
    state.histDays = [];
    setError(error.message);
  }
  renderHistDays();
}

function renderHistDays() {
  if (!state.histDays.length) {
    elements.histDayList.innerHTML = "<li class=\"empty\">这个时间段没有记录。</li>";
    elements.histBody.innerHTML = "<p class=\"empty\">换个日期范围试试。</p>";
    elements.histTitle.textContent = "选一天";
    return;
  }
  const exists = state.histDays.some((day) => day.date === state.selectedHistDay);
  if (!exists) state.selectedHistDay = state.histDays[0].date;
  elements.histDayList.innerHTML = state.histDays
    .map((day) => {
      const total = (day.users || []).reduce((sum, user) => sum + (user.runs || []).length, 0);
      const active = day.date === state.selectedHistDay ? " is-active" : "";
      return "<li class=\"script-item" + active + "\" data-day=\"" + escapeHtml(day.date) + "\"><div class=\"script-name\">" + escapeHtml(day.date) + "</div><div class=\"script-meta\">" + (day.users || []).length + " 个账号 · " + total + " 次运行</div></li>";
    })
    .join("");
  elements.histDayList.querySelectorAll(".script-item").forEach((node) => {
    node.addEventListener("click", () => {
      state.selectedHistDay = node.dataset.day;
      renderHistDays();
    });
  });
  renderHistDay();
}

function statusTag(status) {
  const text = String(status || "").toUpperCase();
  if (text === "DONE") return "<span class=\"hist-status is-done\">完成</span>";
  if (text === "ERROR") return "<span class=\"hist-status is-error\">失败</span>";
  return "<span class=\"hist-status\">" + escapeHtml(text || "未知") + "</span>";
}

function renderHistDay() {
  const day = state.histDays.find((item) => item.date === state.selectedHistDay);
  if (!day) {
    elements.histBody.innerHTML = "<p class=\"empty\">选左边的日期。</p>";
    return;
  }
  elements.histTitle.textContent = day.date + " 的运行记录";
  const users = day.users || [];
  if (!users.length) {
    elements.histBody.innerHTML = "<p class=\"empty\">这天没有记录。</p>";
    return;
  }
  elements.histBody.innerHTML = users
    .map((user) => {
      const runs = user.runs || [];
      const rows = runs.length
        ? runs
            .map((run) => {
              const time = String(run.date || "").split(" ").slice(1).join(" ") || run.date;
              const result = run.result ? "<span class=\"hist-result\">" + escapeHtml(run.result) + "</span>" : "";
              const path = run.jsonFile || "";
              return "<li class=\"hist-run\">"
                + "<span class=\"hist-time\">" + escapeHtml(time) + "</span>"
                + statusTag(run.status)
                + result
                + (path ? "<button class=\"mini-button\" type=\"button\" data-log=\"" + escapeHtml(path) + "\">看日志</button>" : "")
                + "</li>";
            })
            .join("")
        : "<li class=\"empty\">没有运行记录。</li>";
      return "<div class=\"hist-user\"><div class=\"hist-user-head\"><span class=\"hist-user-name\">" + escapeHtml(user.name) + "</span><span class=\"hist-count\">" + runs.length + " 次</span></div><ul class=\"hist-runs\">" + rows + "</ul></div>";
    })
    .join("");
  elements.histBody.querySelectorAll("[data-log]").forEach((node) => {
    node.addEventListener("click", () => openHistoryLog(node, node.dataset.log));
  });
}

async function openHistoryLog(node, jsonPath) {
  const host = node.closest(".hist-run");
  if (!host) return;
  const existing = host.nextElementSibling;
  if (existing && existing.classList && existing.classList.contains("hist-log")) {
    existing.remove();
    return;
  }
  const holder = document.createElement("pre");
  holder.className = "hist-log";
  holder.textContent = "读取中…";
  host.after(holder);
  try {
    const data = await postApi("history/detail", { jsonPath: jsonPath });
    const text = data.logContent || "";
    holder.textContent = text ? text.slice(-20000) : "这条记录里没有日志内容。";
  } catch (error) {
    holder.textContent = "读取失败：" + error.message;
  }
}

// ---- 全局设置 / 通知渠道 ----

const SETTING_GROUP_LABELS = {
  Display: "显示",
  Function: "功能",
  Notify: "通知",
  Replay: "录像",
  Start: "启动",
  UI: "界面",
  Update: "更新",
  Voice: "语音",
};

const SETTING_KEY_LABELS = {
  IfToTray: "最小化到托盘",
  IfSilence: "静默运行",
  IfNotification: "运行完成通知",
  IfWebhook: "走 Webhook 通知",
  IfKoishi: "走 Koishi 通知",
  IfMail: "走邮件通知",
  IfServerChan: "走 ServerChan",
  IfCmcc: "走移动云 MAS",
  IfOpenClawQQ: "走 OpenClaw QQ",
  IfShowUpdate: "显示更新提示",
  IfAutoUpdate: "自动更新",
  IfMinimizeOnStart: "启动时最小化",
  HistoryRetentionTime: "历史保留天数",
  IfSilence: "静默运行",
  IfAllowSleep: "允许休眠",
  IfBlockAd: "屏蔽广告",
  IfEnableTelemetry: "发送统计信息",
  IfAgreeBilibili: "已同意 B 站协议",
  IfPersonalMss: "个人 MSS",
  IfHideCloseButton: "隐藏关闭按钮",
  IfShowTray: "显示托盘图标",
  IfToTray: "关闭时最小化到托盘",
  IfSendMail: "邮件通知",
  IfSendStatistic: "发送统计图",
  IfSendSixStar: "六星出货通知",
  IfKoishiSupport: "Koishi 通知",
  IfOpenClawQQ: "OpenClaw QQ",
  IfServerChan: "ServerChan",
  IfCMCCNewMsg: "移动云短信",
  IfPushPlyer: "PushPlus",
  FromAddress: "发件地址",
  ToAddress: "收件地址",
  SMTPServerAddress: "SMTP 服务器",
  AuthorizationCode: "授权码",
  ServerChanKey: "ServerChan Key",
  KoishiServerAddress: "Koishi 地址",
  KoishiToken: "Koishi Token",
  CMCCNewMsgApiKey: "移动云 ApiKey",
  SendTaskResultTime: "任务结果发送时机",
};

async function loadSettings() {
  try {
    const data = await callApi("setting/get", {});
    state.settings = data.config || {};
    setError("");
  } catch (error) {
    state.settings = null;
    setError(error.message);
  }
  renderSettingGroups();
  renderSettingEditor();
}

function renderSettingGroups() {
  if (!elements.settingGroups) return;
  if (!state.settings) {
    elements.settingGroups.innerHTML = '<li class="empty">设置没读到。</li>';
    return;
  }
  const rows = Object.keys(state.settings).map((key) => {
    const active = state.settingGroup === key ? " is-active" : "";
    const count = state.settings[key] && typeof state.settings[key] === "object" ? Object.keys(state.settings[key]).length : 0;
    return '<li class="script-item' + active + '" data-setting-group="' + escapeHtml(key) + '"><div class="script-name">' + escapeHtml(SETTING_GROUP_LABELS[key] || key) + '</div><div class="script-meta">' + count + " 项</div></li>";
  });
  const webhookActive = state.settingGroup === "__webhook" ? " is-active" : "";
  rows.push('<li class="script-item' + webhookActive + '" data-setting-group="__webhook"><div class="script-name">通知渠道</div><div class="script-meta">' + (state.webhooks || []).length + " 个 Webhook</div></li>");
  const subActive = state.settingGroup === "__subscribers" ? " is-active" : "";
  const subCount = Array.isArray(state.subscribers) ? state.subscribers.length + " 个会话" : "看谁在收";
  rows.push('<li class="script-item' + subActive + '" data-setting-group="__subscribers"><div class="script-name">运行通知</div><div class="script-meta">' + subCount + "</div></li>");
  elements.settingGroups.innerHTML = rows.join("");
  elements.settingGroups.querySelectorAll("[data-setting-group]").forEach((node) => {
    node.addEventListener("click", () => {
      state.settingGroup = node.dataset.settingGroup;
      renderSettingGroups();
      if (state.settingGroup === "__webhook" && !state.webhooks.length) loadWebhooks();
      if (state.settingGroup === "__subscribers" && state.subscribers === null) loadSubscribers();
      renderSettingEditor();
    });
  });
}

function settingMeta(group, key) {
  const groups = (SETTING_SCHEMA && SETTING_SCHEMA.GlobalConfig) || {};
  const bag = groups[group] || {};
  const fields = bag.fields || {};
  return fields[key] || null;
}

function settingField(group, key, value) {
  const meta = settingMeta(group, key);
  const label = (meta && meta.label) || SETTING_KEY_LABELS[key] || key;
  const options = meta && Array.isArray(meta.options) ? meta.options : null;
  if (options && typeof value === "string") {
    const current = String(value);
    let html = options
      .map(function (opt) {
        return '<option value="' + escapeHtml(opt) + '"' + (String(opt) === current ? " selected" : "") + ">" + escapeHtml(opt) + "</option>";
      })
      .join("");
    if (current && options.indexOf(current) < 0) {
      html = '<option value="' + escapeHtml(current) + '" selected>' + escapeHtml(current) + "（当前值）</option>" + html;
    }
    return '<label class="task-field"><span>' + escapeHtml(label) + '</span><select class="task-input" data-setting-key="' + escapeHtml(key) + '">' + html + "</select></label>";
  }
  if (value && typeof value === "object") {
    return '<label class="task-field task-field-wide"><span>' + escapeHtml(label) + '</span><textarea class="task-input task-json" rows="4" spellcheck="false" data-kind="json" data-setting-key="' + escapeHtml(key) + '">' + escapeHtml(JSON.stringify(value)) + "</textarea></label>";
  }
  if (typeof value === "boolean") {
    return '<label class="task-field"><span>' + escapeHtml(label) + '</span><span class="check-line"><input type="checkbox" data-setting-key="' + escapeHtml(key) + '"' + (value ? " checked" : "") + " /></span></label>";
  }
  if (typeof value === "number") {
    return '<label class="task-field"><span>' + escapeHtml(label) + '</span><input class="task-input" type="number" data-setting-key="' + escapeHtml(key) + '" value="' + escapeHtml(value) + '" /></label>';
  }
  return '<label class="task-field"><span>' + escapeHtml(label) + '</span><input class="task-input" type="text" data-setting-key="' + escapeHtml(key) + '" value="' + escapeHtml(value == null ? "" : value) + '" /></label>';
}

function renderSettingEditor() {
  if (!elements.settingEditor) return;
  if (state.settingGroup === "__webhook") {
    elements.settingTitle.textContent = "通知渠道";
    renderWebhookPanel();
    return;
  }
  if (state.settingGroup === "__subscribers") {
    elements.settingTitle.textContent = "运行通知";
    renderSubscriberPanel();
    return;
  }
  if (!state.settings) {
    elements.settingEditor.innerHTML = '<p class="empty">设置没读到。</p>';
    return;
  }
  const group = state.settingGroup;
  const data = state.settings[group];
  elements.settingTitle.textContent = SETTING_GROUP_LABELS[group] || group;
  if (!data || typeof data !== "object") {
    elements.settingEditor.innerHTML = '<p class="empty">这组没有配置项。</p>';
    return;
  }
  const fields = Object.keys(data)
    .map((key) => {
      if (group === "Replay" && key === "Password") {
        return '<label class="task-field"><span>密码（掩码）</span><input class="task-input" type="text" value="' + escapeHtml(data[key]) + '" disabled /></label>';
      }
      return settingField(group, key, data[key]);
    })
    .join("");
  elements.settingEditor.innerHTML = '<div class="task-group"><div class="task-group-title">' + escapeHtml(SETTING_GROUP_LABELS[group] || group) + '</div><div class="task-grid">' + fields + "</div></div>" + '<p class="hint">改完即时生效，只提交这一项。</p>';
}

async function persistSetting(target) {
  const group = state.settingGroup;
  if (!group || group === "__webhook" || !state.settings) return;
  const key = target.dataset.settingKey;
  if (!key) return;
  let value;
  if (target.type === "checkbox") {
    value = target.checked;
  } else if (target.dataset && target.dataset.kind === "json") {
    const raw = String(target.value || "").trim();
    try {
      value = raw ? JSON.parse(raw) : null;
      target.classList.remove("is-invalid");
    } catch (error) {
      target.classList.add("is-invalid");
      showToast("JSON 格式不对，先修一下", true);
      return;
    }
  } else if (target.type === "number") {
    value = target.value === "" ? 0 : Number(target.value);
  } else {
    value = target.value;
  }
  const payload = {};
  payload[group] = {};
  payload[group][key] = value;
  try {
    await postApi("setting/save", { data: payload });
    if (state.settings[group]) state.settings[group][key] = value;
    showToast("已保存 " + (SETTING_KEY_LABELS[key] || key));
  } catch (error) {
    showToast(error.message, true);
  }
}

async function testNotify() {
  try {
    await postApi("setting/test_notify", {});
    showToast("测试通知发出去了");
  } catch (error) {
    showToast(error.message, true);
  }
}

async function loadWebhooks() {
  try {
    const data = await callApi("webhooks", {});
    state.webhooks = data.webhooks || [];
  } catch (error) {
    state.webhooks = [];
    showToast(error.message, true);
  }
  renderWebhookPanel();
}

async function loadSubscribers() {
  try {
    const payload = await callApi("notifications", {});
    state.subscribers = Array.isArray(payload.subscribers) ? payload.subscribers : [];
  } catch (error) {
    state.subscribers = [];
    setError(error.message);
  }
  renderSettingGroups();
  renderSettingEditor();
}

function renderSubscriberPanel() {
  if (!elements.settingEditor) return;
  const list = Array.isArray(state.subscribers) ? state.subscribers : null;
  let body;
  if (list === null) {
    body = '<p class="empty">正在读取订阅列表…</p>';
  } else if (!list.length) {
    body = '<p class="empty">还没有人订阅。</p>';
  } else {
    body = '<ul class="subscriber-list">' + list
      .map(function (item) {
        const title = item.display || item.qq || item.umo;
        const meta = [item.qq ? "QQ " + item.qq : "", item.umo].filter(Boolean).join(" · ");
        return '<li class="subscriber-row"><div class="subscriber-main"><div class="script-name">' + escapeHtml(title) + '</div><div class="script-meta">' + escapeHtml(meta) + '</div></div><button class="mini-button is-danger" data-sub-remove="' + escapeHtml(item.umo) + '">移除</button></li>';
      })
      .join("") + "</ul>";
  }
  elements.settingEditor.innerHTML =
    '<div class="task-group"><div class="task-group-title">运行通知订阅者</div>' + body +
    '<p class="hint">谁想收通知，就在群里或私聊机器人发 <code>/mas 订阅</code>，跑完一个脚本、失败、卡住都会推给他；退订发 <code>/mas 取消订阅</code>。这里是只读名单，删掉某一行等于替他退订。</p></div>';
}

async function removeSubscriber(umo) {
  if (!umo) return;
  try {
    await postApi("notification/remove", { umo: umo });
  } catch (error) {
    setError(error.message);
    return;
  }
  state.subscribers = (state.subscribers || []).filter(function (item) { return item.umo !== umo; });
  renderSettingGroups();
  renderSettingEditor();
  showToast("已移除这个订阅会话。");
}

function renderWebhookPanel() {
  if (!elements.settingEditor) return;
  const list = state.webhooks || [];
  const rows = list.length
    ? list
        .map((item) => {
          const active = state.editingWebhook && state.editingWebhook.webhookId === item.uid ? " is-active" : "";
          return '<div class="webhook-row' + active + '" data-webhook="' + escapeHtml(item.uid) + '"><div class="webhook-main"><div class="script-name">' + escapeHtml(item.name) + (item.enabled ? ' <span class="hist-status is-done">启用</span>' : ' <span class="hist-status">停用</span>') + '</div><div class="script-meta">' + escapeHtml(item.method || "POST") + " " + escapeHtml(item.url || "") + '</div></div><span class="queue-actions"><button class="mini-button" data-webhook-del="' + escapeHtml(item.uid) + '" type="button"><i class=&quot;mdi mdi-delete-outline&quot;></i> 删除</button></span></div>';
        })
        .join("")
    : '<p class="empty">还没有通知渠道。</p>';
  const editor = state.editingWebhook ? renderWebhookEditor() : '<p class="empty">点上面一条展开编辑，或者新建一个。</p>';
  elements.settingEditor.innerHTML = '<div class="queue-block"><div class="queue-block-head"><span>Webhook 列表</span><button class="mini-button" id="webhook-add" type="button"><i class=&quot;mdi mdi-plus&quot;></i> 新建</button></div>' + rows + "</div>" + editor;
  elements.settingEditor.querySelectorAll("[data-webhook]").forEach((node) => {
    node.addEventListener("click", (rawEvent) => {
      if (rawEvent.target && rawEvent.target.hasAttribute && rawEvent.target.hasAttribute("data-webhook-del")) return;
      selectWebhook(node.dataset.webhook);
    });
  });
  elements.settingEditor.querySelectorAll("[data-webhook-del]").forEach((node) => {
    node.addEventListener("click", (rawEvent) => {
      rawEvent.stopPropagation();
      deleteWebhook(node.dataset.webhookDel);
    });
  });
  const addButton = document.getElementById("webhook-add");
  if (addButton) addButton.addEventListener("click", createWebhook);
  const testButton = document.getElementById("webhook-test");
  if (testButton) testButton.addEventListener("click", testWebhook);
  const saveButton = document.getElementById("webhook-save");
  if (saveButton) saveButton.addEventListener("click", saveWebhook);
}

function renderWebhookEditor() {
  const editing = state.editingWebhook;
  const data = editing.data || {};
  const info = data.Info || {};
  const payload = data.Data || {};
  const parts = [];
  parts.push('<div class="task-group"><div class="task-group-title">基本信息</div><div class="task-grid">');
  parts.push('<label class="task-field"><span>名称</span><input class="task-input" type="text" data-webhook-path="Info.Name" value="' + escapeHtml(info.Name == null ? "" : info.Name) + '" /></label>');
  parts.push('<label class="task-field"><span>启用</span><span class="check-line"><input type="checkbox" data-webhook-path="Info.Enabled"' + (info.Enabled ? " checked" : "") + " /></span></label>");
  parts.push('<label class="task-field"><span>请求方式</span><input class="task-input" type="text" data-webhook-path="Data.Method" value="' + escapeHtml(payload.Method == null ? "POST" : payload.Method) + '" /></label>');
  parts.push('<label class="task-field task-field-wide"><span>地址</span><input class="task-input" type="text" data-webhook-path="Data.Url" value="' + escapeHtml(payload.Url == null ? "" : payload.Url) + '" /></label>');
  parts.push("</div></div>");
  parts.push('<div class="task-group"><div class="task-group-title">请求头 JSON</div><textarea class="task-json" id="webhook-headers" spellcheck="false"></textarea></div>');
  parts.push('<div class="task-group"><div class="task-group-title">模板 JSON</div><textarea class="task-json" id="webhook-template" spellcheck="false"></textarea></div>');
  parts.push('<div class="inline-form-actions"><button class="mini-button" id="webhook-save" type="button"><i class=&quot;mdi mdi-content-save-outline&quot;></i> 保存</button><button class="mini-button" id="webhook-test" type="button">发送测试</button></div>');
  window.setTimeout(() => {
    const headers = document.getElementById("webhook-headers");
    if (headers) headers.value = typeof payload.Headers === "string" ? payload.Headers : JSON.stringify(payload.Headers || {}, null, 2);
    const template = document.getElementById("webhook-template");
    if (template) template.value = typeof payload.Template === "string" ? payload.Template : JSON.stringify(payload.Template || {}, null, 2);
  }, 0);
  return parts.join("");
}

async function selectWebhook(uid) {
  try {
    const data = await postApi("webhook/detail", { webhookId: uid });
    state.editingWebhook = { webhookId: uid, data: data.config || {} };
    renderWebhookPanel();
  } catch (error) {
    showToast(error.message, true);
  }
}

function collectWebhookData() {
  const editing = state.editingWebhook;
  if (!editing) return null;
  const data = editing.data || {};
  const headers = document.getElementById("webhook-headers");
  const template = document.getElementById("webhook-template");
  // AUTO-MAS 里 Headers / Template 本身就是「装着 JSON 的字符串」，
  // 传对象会被 Pydantic 判 422（string_type），所以这里只校验、不解析。
  data.Data = data.Data || {};
  if (headers) {
    const text = headers.value.trim();
    if (text && !looksLikeJson(text)) {
      showToast("请求头不是合法的 JSON", true);
      return null;
    }
    data.Data.Headers = text || "{ }";
  }
  if (template) {
    const text = template.value;
    if (text.trim() && !looksLikeJson(text.trim())) {
      showToast("模板不是合法的 JSON", true);
      return null;
    }
    data.Data.Template = text;
  }
  return data;
}

function looksLikeJson(text) {
  try {
    JSON.parse(text);
    return true;
  } catch (error) {
    return false;
  }
}

async function saveWebhook() {
  const data = collectWebhookData();
  if (!data) return;
  try {
    await postApi("webhook/save", { webhookId: state.editingWebhook.webhookId, data });
    showToast("通知渠道已保存");
    await loadWebhooks();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function testWebhook() {
  const data = collectWebhookData();
  if (!data) return;
  try {
    await postApi("webhook/test", { data });
    showToast("测试请求发出去啦");
  } catch (error) {
    showToast(error.message, true);
  }
}

async function createWebhook() {
  try {
    const created = await postApi("webhook/create", {});
    await loadWebhooks();
    if (created.webhookId) await selectWebhook(created.webhookId);
    showToast("已新建通知渠道");
  } catch (error) {
    showToast(error.message, true);
  }
}

async function deleteWebhook(uid) {
  if (!window.confirm("删掉这个通知渠道？")) return;
  try {
    await postApi("webhook/delete", { webhookId: uid });
    if (state.editingWebhook && state.editingWebhook.webhookId === uid) state.editingWebhook = null;
    showToast("已删除");
    await loadWebhooks();
  } catch (error) {
    showToast(error.message, true);
  }
}

// ---- 模拟器 ----

const DEVICE_STATUS = {
  0: "在线",
  1: "离线",
  2: "开启中",
  3: "关闭中",
  4: "异常",
  5: "未找到",
  10: "未知",
};

function deviceStatusText(status) {
  const key = Number(status);
  return DEVICE_STATUS[key] || "未知";
}

async function loadEmulators() {
  try {
    const data = await callApi("emulators", {});
    state.emulators = data.emulators || [];
    setError("");
  } catch (error) {
    state.emulators = [];
    setError(error.message);
  }
  renderEmulatorList();
}

function renderEmulatorList() {
  if (!elements.emulatorList) return;
  if (!state.emulators.length) {
    elements.emulatorList.innerHTML = '<li class="empty">没有模拟器项，点上面「新建」加一个。</li>';
    return;
  }
  elements.emulatorList.innerHTML = state.emulators
    .map((item) => {
      const active = item.uid === state.selectedEmulator ? " is-active" : "";
      const online = (item.devices || []).filter((device) => Number(device.status) === 0).length;
      const meta = (item.devices || []).length + " 个槽位 · " + online + " 在线";
      return '<li class="script-item' + active + '" data-emulator="' + escapeHtml(item.uid) + '"><div class="script-name">' + escapeHtml(item.name) + '</div><div class="script-meta">' + escapeHtml(meta) + "</div></li>";
    })
    .join("");
  elements.emulatorList.querySelectorAll("[data-emulator]").forEach((node) => {
    node.addEventListener("click", () => openEmulator(node.dataset.emulator));
  });
}

async function openEmulator(uid) {
  state.selectedEmulator = uid;
  renderEmulatorList();
  const item = state.emulators.find((row) => row.uid === uid);
  if (!item) return;
  elements.emulatorTitle.textContent = item.name;
  if (elements.emulatorSave) elements.emulatorSave.classList.remove("is-hidden");
  if (elements.emulatorDelete) elements.emulatorDelete.classList.remove("is-hidden");
  elements.emulatorEditor.innerHTML = '<p class="empty">读取中…</p>';
  try {
    const data = await postApi("emulator/detail", { emulatorId: uid });
    state.emulatorData = data.config || {};
    renderEmulatorEditor();
  } catch (error) {
    state.emulatorData = null;
    elements.emulatorEditor.innerHTML = '<p class="empty">读取失败：' + escapeHtml(error.message) + "</p>";
  }
}

function renderEmulatorEditor() {
  const data = state.emulatorData;
  if (!elements.emulatorEditor) return;
  if (!data) {
    elements.emulatorEditor.innerHTML = '<p class="empty">选一个模拟器项。</p>';
    return;
  }
  const item = state.emulators.find((row) => row.uid === state.selectedEmulator);
  const devices = (item || {}).devices || [];
  const parts = [];
  const deviceRows = devices.length
    ? devices
        .map((device) => {
          return '<div class="emulator-device"><span class="queue-index">' + escapeHtml(device.index) + '</span><span class="emulator-device-name">' + escapeHtml(device.title || "槽位 " + device.index) + '</span><span class="hist-status">' + escapeHtml(deviceStatusText(device.status)) + '</span><span class="emulator-adb">' + escapeHtml(device.adb || "") + '</span><span class="queue-actions"><button class="mini-button" data-open="' + escapeHtml(device.index) + '" type="button">开机</button><button class="mini-button" data-close="' + escapeHtml(device.index) + '" type="button">关机</button><button class="mini-button" data-show="' + escapeHtml(device.index) + '" type="button">唤出</button></span></div>';
        })
        .join("")
    : '<p class="empty">这个模拟器项还没有上报槽位状态。</p>';
  parts.push('<div class="queue-block"><div class="queue-block-head"><span>设备槽位</span></div>' + deviceRows + "</div>");
  state.configRoot = data;
  Object.keys(data).forEach((key) => {
    const value = data[key];
    if (!value || typeof value !== "object" || Array.isArray(value)) return;
    const inner = renderSchemaGroup(EMULATOR_SCHEMA, "EmulatorConfig", [key], value, 0);
    if (!inner) return;
    const title = CONFIG_GROUP_LABELS[key] || SCRIPT_GROUP_LABELS[key] || key;
    parts.push('<section class="task-group"><h3>' + escapeHtml(title) + "</h3>" + inner + "</section>");
  });
  state.configRoot = null;
  parts.push('<div class="task-group"><div class="task-group-title">完整配置 JSON</div><textarea class="task-json" id="emulator-json" spellcheck="false"></textarea></div>');
  elements.emulatorEditor.innerHTML = parts.join("");
  const json = document.getElementById("emulator-json");
  if (json) json.value = JSON.stringify(data, null, 2);
  elements.emulatorEditor.querySelectorAll("[data-open],[data-close],[data-show]").forEach((node) => {
    node.addEventListener("click", () => {
      let operate = "open";
      if (node.hasAttribute("data-close")) operate = "close";
      if (node.hasAttribute("data-show")) operate = "show";
      operateEmulator(operate, node.dataset[operate]);
    });
  });
}

function commitEmulatorValue(target) {
  if (!state.emulatorData) return;
  const schemaNode = (target.getAttribute && target.getAttribute("data-conf-path")) ||
    (target.closest && target.closest("[data-multi]"));
  if (schemaNode) {
    state.configRoot = state.emulatorData;
    commitConfigValue(target);
    state.configRoot = null;
    const emuJson = document.getElementById("emulator-json");
    if (emuJson) emuJson.value = JSON.stringify(state.emulatorData, null, 2);
    return;
  }
  const path = target.dataset.scriptPath;
  if (!path) return;
  const parts = path.split(".");
  let node = state.emulatorData;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    if (!node[key] || typeof node[key] !== "object") node[key] = {};
    node = node[key];
  }
  const last = parts[parts.length - 1];
  if (target.type === "checkbox") node[last] = target.checked;
  else if (target.type === "number") node[last] = target.value === "" ? null : Number(target.value);
  else node[last] = target.value;
  const json = document.getElementById("emulator-json");
  if (json) json.value = JSON.stringify(state.emulatorData, null, 2);
}

async function saveEmulator() {
  if (!state.selectedEmulator) {
    showToast("先选一个模拟器项", true);
    return;
  }
  const json = document.getElementById("emulator-json");
  let data = state.emulatorData;
  if (json && json.value.trim()) {
    try {
      data = JSON.parse(json.value);
    } catch (error) {
      showToast("JSON 格式不对，先修一下", true);
      return;
    }
  }
  if (!data) return;
  try {
    await postApi("emulator/save", { emulatorId: state.selectedEmulator, data });
    showToast("模拟器配置已保存");
    await loadEmulators();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function createEmulator() {
  try {
    const created = await postApi("emulator/create", {});
    showToast("已新建模拟器项");
    await loadEmulators();
    if (created.emulatorId) await openEmulator(created.emulatorId);
  } catch (error) {
    showToast(error.message, true);
  }
}

async function deleteEmulator() {
  if (!state.selectedEmulator) {
    showToast("先选一个模拟器项", true);
    return;
  }
  const item = state.emulators.find((row) => row.uid === state.selectedEmulator);
  if (!window.confirm("删掉模拟器项「" + ((item || {}).name || state.selectedEmulator) + "」？")) return;
  try {
    await postApi("emulator/delete", { emulatorId: state.selectedEmulator });
    state.selectedEmulator = null;
    state.emulatorData = null;
    elements.emulatorTitle.textContent = "选一个模拟器";
    elements.emulatorEditor.innerHTML = '<p class="empty">选一个模拟器项。</p>';
    showToast("已删除");
    await loadEmulators();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function operateEmulator(operate, index) {
  if (!state.selectedEmulator) return;
  try {
    await postApi("emulator/operate", { emulatorId: state.selectedEmulator, operate, index: String(index) });
    showToast(operate === "open" ? "发开机指令了" : operate === "close" ? "发关机指令了" : "已唤出窗口");
    window.setTimeout(loadEmulators, 1500);
  } catch (error) {
    showToast(error.message, true);
  }
}

async function searchEmulators() {
  try {
    const data = await callApi("emulator/search", {});
    const list = data.emulators || [];
    if (!list.length) {
      showToast("没在本机扫描到模拟器");
      return;
    }
    const lines = list.map((item) => item.type + "｜" + item.name + "｜" + item.path).join("\n");
    window.alert("扫描到 " + list.length + " 个：\n" + lines);
  } catch (error) {
    showToast(error.message, true);
  }
}

// ---- 托管项（脚本）管理 ----

const SCRIPT_ADD_TYPES = [
  ["MAA", "MAA"],
  ["MaaEnd", "终末地"],
  ["M9A", "M9A"],
  ["MaaFW", "MaaFramework"],
  ["HSR", "星穹铁道"],
  ["BetterGI", "BetterGI"],
  ["ZzzOd", "绝区零"],
  ["BAAH", "蔚蓝档案"],
  ["Whimbox", "奇想盒"],
  ["MSS", "MSS"],
  ["Okww", "OKWW"],
  ["OkNte", "OKNTE"],
  ["SRC", "SRC"],
  ["General", "通用"],
];

const SCRIPT_GROUP_LABELS = {
  Info: "基本信息",
  Emulator: "模拟器绑定",
  Run: "运行策略",
  Update: "更新策略",
  Game: "游戏",
  Script: "脚本",
  Device: "设备",
  Selection: "资源选择",
  Task: "任务",
  Embedded: "内嵌资源",
};

const SCRIPT_KEY_LABELS = {
  Name: "名称",
  Path: "脚本路径",
  Id: "模拟器 ID",
  Index: "设备槽位",
  RootPath: "根目录",
  ProjectLabel: "项目标签",
  Resource: "资源",
  Controller: "控制器",
  RunTimesLimit: "重试次数",
  ProxyTimesLimit: "代理次数上限",
  RoutineTimeLimit: "常规任务时限（分）",
  HardTimeLimit: "单账号总时限（分）",
  GameUpdateTimeLimit: "游戏更新时限（分）",
  AnnihilationTimeLimit: "剿灭时限（分）",
  RunTimeLimit: "运行时限（分）",
  TaskTimeLimit: "单任务时限（分）",
  TaskTimeLimitOverrides: "任务时限覆盖",
  IfCheckGameUpdate: "检查游戏更新",
  IfAutoInstallGameApk: "自动安装 APK",
  UseAdmin: "以管理员运行",
  TaskTransitionMethod: "任务切换方式",
  GameUpdateMode: "游戏更新方式",
  AccountSwitchMethod: "账号切换方式",
  DailyOnceTasks: "每日任务",
  WeeklyOnceTasks: "每周任务",
  MonthlyOnceTasks: "每月任务",
  LoopGuard: "循环保护",
  TakeoverEnabled: "启用接管更新",
  MirrorChyanCDK: "Mirror 酱 CDK",
  TakeoverMigrationVersion: "接管迁移版本",
  AutoUpdateMode: "自动更新方式",
  Channel: "更新通道",
  GitHubRepo: "GitHub 仓库",
  GitHubTag: "GitHub 标签",
  GitHubAssetPattern: "GitHub 资产匹配",
  ProxyAddress: "代理地址",
  Source: "更新源",
  IfAutoUpdate: "自动更新",
  EmulatorId: "模拟器",
  EmulatorIndex: "设备槽位",
  PackageName: "包名",
  ProcessName: "进程名",
  CloseOnFinish: "完成后关闭",
  Enabled: "启用",
  Type: "类型",
  Arguments: "启动参数",
  ClientPath: "客户端路径",
  LauncherPath: "启动器路径",
  LaunchPath: "启动路径",
  LaunchMode: "启动方式",
  LaunchBeforeTask: "任务前启动",
  ControllerType: "控制器类型",
  Hotkeys: "热键",
  URL: "网址",
  SetResolution: "设置分辨率",
  UnityResolution: "Unity 分辨率",
  RestoreResolution: "恢复分辨率",
  RestoreResolutionWidth: "恢复宽度",
  RestoreResolutionHeight: "恢复高度",
  RestoreDisplayType: "恢复显示方式",
  UpdateTimeLimit: "更新时限（分）",
  UpdateFullSyncLimit: "完整同步时限（分）",
  WaitTime: "等待时间（秒）",
  IfForceClose: "强制关闭",
  AccountSwitch: "账号切换",
  AdbAddress: "ADB 地址",
  AdbPath: "ADB 路径",
  AdbInputMethods: "ADB 输入方式",
  AdbScreencapMethods: "ADB 截图方式",
  GamepadType: "手柄类型",
  HWnd: "窗口句柄",
  PlayCoverAddress: "PlayCover 地址",
  PlayCoverUuid: "PlayCover UUID",
  Win32KeyboardMethod: "Win32 键盘方式",
  Win32MouseMethod: "Win32 鼠标方式",
  Win32ScreencapMethod: "Win32 截图方式",
  ScriptPath: "脚本路径",
  ConfigPath: "配置路径",
  ConfigPathMode: "配置路径方式",
  UpdateConfigMode: "配置更新方式",
  IfTrackProcess: "跟踪进程",
  TrackProcessName: "跟踪进程名",
  TrackProcessExe: "跟踪可执行文件",
  TrackProcessCmdline: "跟踪命令行",
  ErrorLog: "错误日志",
  ErrorLogMode: "错误日志方式",
  SuccessLog: "成功日志",
  SuccessLogMode: "成功日志方式",
  LogPath: "日志路径",
  LogPathFormat: "日志路径格式",
  LogTimeFormat: "日志时间格式",
  LogTimeStart: "日志开始时间",
  LogTimeEnd: "日志结束时间",
  LogHookEnabled: "日志钩子",
  LogHookRules: "日志钩子规则",
  PushLogEnabled: "推送日志",
  PushLogPatterns: "推送匹配规则",
  Tasks: "任务",
  Templates: "任务模板",
  FollowSource: "跟随上游源",
  ImportedAt: "导入时间",
  Report: "上报数据",
  SourceVersion: "源版本",
};

// 同名 key 在不同组里含义不同（Info.Path 是脚本路径、Game.Path 是游戏路径），按组覆盖。
const GROUP_KEY_LABELS = {
  Info: { Path: "脚本目录", Name: "名称" },
  Game: { Path: "游戏路径" },
};

function currentScriptType() {
  const id = activeScriptId();
  const item = (state.overview?.scripts || []).find((row) => row.uid === id);
  return item ? String(item.type || "") : "";
}

function emulatorBindInner(data) {
  const current = String((data.Emulator || {}).Id || "-");
  const options = (state.emulators || [])
    .map(function (item) {
      return '<option value="' + escapeHtml(item.uid) + '"' + (current === item.uid ? " selected" : "") + ">" + escapeHtml(item.name) + "</option>";
    })
    .join("");
  let select = '<select class="task-input" data-conf-path="Emulator.Id">';
  select += '<option value="-"' + (current === "-" ? " selected" : "") + ">（未绑定）</option>";
  if (options) select += options;
  else if (current !== "-") select += '<option value="' + escapeHtml(current) + '" selected>' + escapeHtml(current) + "</option>";
  select += "</select>";
  const indexValue = escapeHtml((data.Emulator || {}).Index == null ? "" : (data.Emulator || {}).Index);
  return (
    '<div class="task-grid">' +
    '<label class="task-field"><span>模拟器</span>' + select + "</label>" +
    '<label class="task-field"><span>设备槽位</span><input class="task-input" type="text" data-conf-path="Emulator.Index" value="' + indexValue + '" /></label>' +
    "</div>"
  );
}

// ---- MaaEnd 原生任务参数（售卖弹性物资） ----

function maaendNativeTaskName(info) {
  const task = (info && info.task) || {};
  return String(task.name || "AutoSell");
}

function maaendNativeFieldHtml(field) {
  const key = String(field.key || "");
  const label = String(field.label || key);
  const kind = String(field.kind || "");
  if (kind === "switch") {
    return '<label class="task-field"><span>' + escapeHtml(label) + '</span><span class="check-line"><input type="checkbox" data-native-key="' + escapeHtml(key) + '"' + (field.value ? " checked" : "") + " /> 启用</span></label>";
  }
  if (kind === "select") {
    const choices = field.choices || [];
    let select = '<select class="task-input" data-native-key="' + escapeHtml(key) + '">';
    choices.forEach(function (item) {
      const value = String(item.value);
      select += '<option value="' + escapeHtml(value) + '"' + (String(field.value) === value ? " selected" : "") + ">" + escapeHtml(String(item.label || value)) + "</option>";
    });
    select += "</select>";
    return '<label class="task-field"><span>' + escapeHtml(label) + "</span>" + select + "</label>";
  }
  if (kind === "checkbox") {
    const picked = Array.isArray(field.value) ? field.value.map(String) : [];
    const chips = (field.choices || []).map(function (item) {
      const value = String(item.value);
      return '<label class="toggle-item"><input type="checkbox" data-native-option="' + escapeHtml(key) + '" value="' + escapeHtml(value) + '"' + (picked.indexOf(value) >= 0 ? " checked" : "") + " /> <span>" + escapeHtml(String(item.label || value)) + "</span></label>";
    }).join("");
    return '<div class="task-field task-field-wide"><span>' + escapeHtml(label) + '</span><div class="toggle-grid">' + chips + "</div></div>";
  }
  if (kind === "inputs") {
    return (field.inputs || []).map(function (spec) {
      const name = String(spec.name || "");
      const type = spec.number ? "number" : "text";
      const tip = spec.default == null || spec.default === "" ? "" : "默认 " + spec.default;
      return '<label class="task-field"><span>' + escapeHtml(String(spec.label || name)) + '</span><input class="task-input" type="' + type + '" data-native-key="' + escapeHtml(name) + '" value="' + escapeHtml(spec.value == null ? "" : String(spec.value)) + '" placeholder="' + escapeHtml(String(tip)) + '" /></label>';
    }).join("");
  }
  return "";
}

function maaendNativeHostId(scope) {
  return scope === "user" ? "maaend-user-body" : "maaend-native-body";
}

function maaendNativeCache(scope) {
  return scope === "user" ? state.maaendNativeUser : state.maaendNative;
}

function maaendNativeHint(scope, info) {
  if (scope === "user") {
    const base = String(info.baseLabel || info.base || "原生");
    const file = String(info.configPath || info.path || "");
    return "这个账号用的是「" + base + "」基线，改的是 " + file +
      "。改完下一次运行就生效；要换基线回「基础」页改。";
  }
  return "改的是 MaaEnd 安装目录的 " + String(info.path || "") +
    "。原生基线的账号直接读这份，改了全局生效；共享 / 独立基线的账号读 AUTO-MAS 目录里的副本，到账号的任务配置页改。";
}

function maaendNativeBody(scope) {
  const point = scope === "user" ? "user" : "script";
  const cached = maaendNativeCache(point);
  if (!cached || (!cached.info && !cached.error)) {
    return '<p class="hint">正在读 MaaEnd 配置…</p>';
  }
  const retryId = point === "user" ? "maaend-user-retry" : "maaend-native-retry";
  if (cached.error) {
    return '<p class="hint">' + escapeHtml(cached.error) + '</p><button class="mini-button" id="' + retryId + '">重试</button>';
  }
  const info = cached.info || {};
  const tasks = info.tasks || [];
  let html = '<p class="hint">' + escapeHtml(maaendNativeHint(point, info)) + " 下面是这份配置里带参数的任务，点标题展开。</p>";
  if (!tasks.length) {
    html += '<p class="hint">这份 MaaEnd 配置里没找到能改的任务参数。</p><button class="mini-button" id="' + retryId + '">重新读一次</button>';
    return html;
  }
  tasks.forEach(function (task) {
    const label = String(task.label || task.name || "");
    const title = "MaaEnd · " + label;
    const meta = (task.fields || []).length + " 项" + (task.enabled === false ? " · 已停用" : "");
    let inner = "";
    if (task.present === false) inner += '<p class="hint">这个任务目前不在 MaaEnd 配置里，保存后会按默认值加进去。</p>';
    inner += '<div class="task-grid">';
    (task.fields || []).forEach(function (field) {
      inner += maaendNativeFieldHtml(field);
    });
    inner += "</div>";
    inner += '<div class="native-actions"><button class="mini-button" data-native-task="' + escapeHtml(String(task.name || "")) + '" data-native-scope="' + point + '">保存这个任务</button><span class="hint" data-native-state="' + escapeHtml(String(task.name || "")) + '"></span></div>';
    html += scriptSubFold(title, inner, meta);
  });
  return html;
}

function maaendNativeBlock(scope) {
  const point = scope === "user" ? "user" : "script";
  const info = (maaendNativeCache(point) || {}).info || {};
  const tasks = info.tasks || [];
  const title = point === "user" ? "MaaEnd 参数（这个账号的配置）" : "MaaEnd 原生任务参数";
  const meta = tasks.length ? tasks.length + " 个任务" : "";
  return scriptGroup(title, '<div id="' + maaendNativeHostId(point) + '">' + maaendNativeBody(point) + "</div>", meta);
}

function refreshMaaendNative(scope) {
  const point = scope === "user" ? "user" : "script";
  const host = document.getElementById(maaendNativeHostId(point));
  if (!host) return;
  host.innerHTML = maaendNativeBody(point);
  const fold = host.closest("details");
  const meta = fold ? fold.querySelector("summary .fold-meta") : null;
  const info = (maaendNativeCache(point) || {}).info || {};
  const tasks = info.tasks || [];
  if (meta) meta.textContent = tasks.length ? tasks.length + " 个任务" : "";
}

async function loadMaaendNativeFor(scope, scriptId, userId) {
  const point = scope === "user" ? "user" : "script";
  const id = String(scriptId || activeScriptId() || "");
  const uid = point === "user" ? String(userId || "") : "";
  if (!id || (point === "user" && !uid)) return;
  const stamp = id + "|" + uid;
  const existing = maaendNativeCache(point);
  if (existing && existing.scriptId + "|" + existing.userId === stamp && (existing.info || existing.error)) return;
  const skeleton = { scriptId: id, userId: uid, scope: point };
  if (point === "user") state.maaendNativeUser = skeleton;
  else state.maaendNative = skeleton;
  refreshMaaendNative(point);
  try {
    const data = await callApi("maaend/native", uid ? { scriptId: id, userId: uid } : { scriptId: id });
    const cached = maaendNativeCache(point);
    if (!cached || cached.scriptId + "|" + cached.userId !== stamp) return;
    const value = { scriptId: id, userId: uid, scope: point, info: (data && data.native) || {} };
    if (point === "user") state.maaendNativeUser = value;
    else state.maaendNative = value;
  } catch (error) {
    const cached = maaendNativeCache(point);
    if (!cached || cached.scriptId + "|" + cached.userId !== stamp) return;
    const value = { scriptId: id, userId: uid, scope: point, error: error.message };
    if (point === "user") state.maaendNativeUser = value;
    else state.maaendNative = value;
  }
  refreshMaaendNative(point);
}

function loadMaaendNative(scriptId) {
  return loadMaaendNativeFor("script", scriptId, "");
}

function loadMaaendUser(scriptId, userId) {
  return loadMaaendNativeFor("user", scriptId, userId);
}

function collectMaaendNativeValues(scope, host) {
  const point = scope === "user" ? "user" : "script";
  const values = {};
  const root = host || document.getElementById(maaendNativeHostId(point));
  if (!root) return values;
  const groups = {};
  root.querySelectorAll("[data-native-option]").forEach(function (node) {
    const key = String(node.getAttribute("data-native-option") || "");
    if (!key) return;
    if (!groups[key]) groups[key] = [];
    if (node.checked) groups[key].push(String(node.value || ""));
  });
  root.querySelectorAll("[data-native-key]").forEach(function (node) {
    const key = String(node.getAttribute("data-native-key") || "");
    if (!key) return;
    if (node.type === "checkbox") values[key] = !!node.checked;
    else values[key] = String(node.value == null ? "" : node.value);
  });
  Object.keys(groups).forEach(function (key) {
    values[key] = groups[key];
  });
  return values;
}

function applyNativeValues(info, taskName, values) {
  const tasks = (info && info.tasks) || [];
  const task = tasks.find(function (item) {
    return String(item.name || "") === String(taskName || "");
  });
  if (!task) return;
  (task.fields || []).forEach(function (field) {
    const key = String(field.key || "");
    const kind = String(field.kind || "");
    if (!Object.prototype.hasOwnProperty.call(values, key)) return;
    if (kind === "switch") field.value = !!values[key];
    else if (kind === "select") field.value = String(values[key]);
    else if (kind === "checkbox") field.value = values[key];
    else if (kind === "inputs") {
      (field.inputs || []).forEach(function (spec) {
        const name = String(spec.name || "");
        if (Object.prototype.hasOwnProperty.call(values, name)) spec.value = values[name];
      });
    }
  });
}

async function saveMaaendNative(taskName, button, scope) {
  const point = scope === "user" || (button && button.getAttribute("data-native-scope") === "user") ? "user" : "script";
  const cached = maaendNativeCache(point);
  if (!cached || !cached.info) {
    showToast("MaaEnd 配置还没读出来", true);
    return;
  }
  const name = String(taskName || "");
  if (!name) {
    showToast("没认出是哪个任务", true);
    return;
  }
  const host = button ? button.closest("details") : null;
  const stateNode = host ? host.querySelector("[data-native-state]") : null;
  const values = collectMaaendNativeValues(point, host);
  if (!Object.keys(values).length) {
    showToast("这块没有可保存的项", true);
    return;
  }
  if (stateNode) stateNode.textContent = "保存中…";
  if (button) button.disabled = true;
  try {
    const payload = {
      scriptId: cached.scriptId,
      task: name,
      values: values,
      mtime: cached.info.mtime,
    };
    if (point === "user") payload.userId = cached.userId;
    const result = await postApi("maaend/native/save", payload);
    const changed = (result.changed || []).length;
    showToast("已写入 MaaEnd 配置" + (changed ? "（" + changed + " 项）" : "（没有变化）"));
    if (typeof result.mtime === "number") cached.info.mtime = result.mtime;
    applyNativeValues(cached.info, name, values);
    if (stateNode) stateNode.textContent = "已保存 · " + (changed ? changed + " 项" : "无变化");
  } catch (error) {
    if (stateNode) stateNode.textContent = "";
    showToast(error.message, true);
  } finally {
    if (button) button.disabled = false;
  }
}

function scriptFoldOpened(title) {
  return !!(state.scriptFoldOpen && state.scriptFoldOpen.has(title));
}

function foldOpenAttr(title) {
  return scriptFoldOpened(title) ? " open" : "";
}

function scriptGroup(title, inner, extra) {
  if (!inner) return "";
  return '<section class="task-group script-group"><details class="script-fold"' + foldOpenAttr(title) +
    ' data-fold-title="' + escapeHtml(title) + '"><summary><span class="fold-title">' + escapeHtml(title) +
    '</span><span class="fold-meta">' + escapeHtml(String(extra || "")) + '</span></summary><div class="script-fold-body">' + inner + "</div></details></section>";
}

function scriptSubFold(title, inner, extra) {
  return '<details class="script-fold native-task"' + foldOpenAttr(title) +
    ' data-fold-title="' + escapeHtml(title) + '"><summary><span class="fold-title">' + escapeHtml(title) +
    '</span><span class="fold-meta">' + escapeHtml(String(extra || "")) + '</span></summary><div class="script-fold-body">' + inner + "</div></details>";
}

function collectScriptFolds(host) {
  if (!host) return null;
  const opened = new Set();
  host.querySelectorAll("details.script-fold[open]").forEach(function (node) {
    const title = node.getAttribute("data-fold-title") || "";
    if (title) opened.add(title);
  });
  return opened;
}

function renderScriptForm() {
  const data = state.scriptEditing ? state.scriptEditing.data : null;
  if (!data || !elements.scriptForm) return;
  const opened = collectScriptFolds(elements.scriptForm);
  if (opened && (opened.size || state.scriptFoldOpen)) state.scriptFoldOpen = opened;
  const type = currentScriptType();
  const schema = SCRIPT_SCHEMA[type] ? SCRIPT_SCHEMA : null;
  const parts = [];
  state.configRoot = data;
  if (data.Info && typeof data.Info === "object") {
    const inner = renderSchemaGroup(SCRIPT_SCHEMA, type, ["Info"], data.Info, 0);
    if (inner) parts.push(scriptGroup("基本信息", inner));
  }
  parts.push(scriptGroup("模拟器绑定", emulatorBindInner(data)));
  Object.keys(data).forEach(function (key) {
    if (key === "Info" || key === "Emulator" || key === "UserData") return;
    const bag = data[key];
    if (!bag || typeof bag !== "object" || Array.isArray(bag) || !Object.keys(bag).length) return;
    const inner = renderSchemaGroup(SCRIPT_SCHEMA, type, [key], bag, 0);
    if (!inner) return;
    parts.push(scriptGroup(CONFIG_GROUP_LABELS[key] || SCRIPT_GROUP_LABELS[key] || key, inner));
  });
  if (type === "MaaEndConfig") {
    if (!state.maaendNative || state.maaendNative.scriptId !== activeScriptId()) loadMaaendNative(activeScriptId());
    parts.push(maaendNativeBlock());
  }
  if (!schema) {
    parts.push('<p class="hint">这个类型的托管配置没有字段表（可能是 AUTO-MAS 新版本加的脚本），用下面的完整 JSON 改。</p>');
  }
  elements.scriptForm.innerHTML = parts.join("");
  elements.scriptJson.value = JSON.stringify(data, null, 2);
  state.configRoot = null;
}

function commitScriptValue(target) {
  const editing = state.scriptEditing;
  if (!editing) return;
  const schemaNode = (target.getAttribute && target.getAttribute("data-conf-path")) ||
    (target.closest && target.closest("[data-multi]"));
  if (schemaNode) {
    state.configRoot = editing.data;
    commitConfigValue(target);
    state.configRoot = null;
    elements.scriptJson.value = JSON.stringify(editing.data, null, 2);
    return;
  }
  const path = target.dataset.scriptPath;
  if (!path) return;
  const parts = path.split(".");
  let node = editing.data;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    if (!node[key] || typeof node[key] !== "object") node[key] = {};
    node = node[key];
  }
  const last = parts[parts.length - 1];
  if (target.type === "checkbox") node[last] = target.checked;
  else if (target.type === "number") node[last] = target.value === "" ? null : Number(target.value);
  else node[last] = target.value;
  elements.scriptJson.value = JSON.stringify(editing.data, null, 2);
}

async function loadScriptIntoDrawer() {
  const scriptId = activeScriptId();
  if (!scriptId) {
    showToast("先选一个托管项", true);
    return;
  }
  try {
    const data = await postApi("script/detail", { scriptId });
    state.scriptEditing = { scriptId, data: data.config || {} };
    state.maaendNative = null;
    state.maaendNativeUser = null;
    if (!state.emulators.length) {
      try {
        const list = await callApi("emulators", {});
        state.emulators = list.emulators || [];
      } catch (error) {
        state.emulators = [];
      }
    }
    renderScriptForm();
    state.scriptSnapshot = elements.scriptJson.value;
    loadMaaendOptions();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function saveScript() {
  if (!state.scriptEditing || state.busy) return;
  let data;
  try {
    data = JSON.parse(elements.scriptJson.value);
  } catch (error) {
    if (elements.scriptSaveState) elements.scriptSaveState.textContent = "JSON 格式不对，先修一下";
    return;
  }
  const scriptId = state.scriptEditing.scriptId;
  state.busy = true;
  if (elements.scriptDrawerSave) elements.scriptDrawerSave.disabled = true;
  if (elements.scriptSaveState) elements.scriptSaveState.textContent = "保存中…";
  try {
    await postApi("script/save", { scriptId, data });
    if (elements.scriptSaveState) elements.scriptSaveState.textContent = "";
    showToast("托管项已保存");
    closeScriptDrawer();
    await loadOverview();
    await selectScript(scriptId);
  } catch (error) {
    if (elements.scriptSaveState) elements.scriptSaveState.textContent = error.message;
  } finally {
    state.busy = false;
    if (elements.scriptDrawerSave) elements.scriptDrawerSave.disabled = false;
  }
}

function removeScriptCreateForm() {
  const host = document.getElementById("script-create-form");
  if (host) host.remove();
}

function openScriptCreate() {
  if (document.getElementById("script-create-form")) {
    removeScriptCreateForm();
    return;
  }
  const typeOptions = SCRIPT_ADD_TYPES.map(([value, label]) => {
    return '<option value="' + escapeHtml(value) + '">' + escapeHtml(label) + "</option>";
  }).join("");
  const copyOptions = (state.overview ? state.overview.scripts || [] : []).map((item) => {
    return '<option value="' + escapeHtml(item.uid) + '">' + escapeHtml(item.name) + "（" + escapeHtml(item.typeLabel || item.type) + "）</option>";
  }).join("");
  const host = document.createElement("div");
  host.className = "inline-form";
  host.id = "script-create-form";
  host.innerHTML = [
    '<label class="task-field"><span>脚本类型</span><select class="task-input" id="sc-type">' + typeOptions + "</select></label>",
    '<label class="task-field"><span>名称</span><input class="task-input" type="text" id="sc-name" placeholder="新托管" /></label>',
    '<label class="task-field"><span>复制自</span><select class="task-input" id="sc-copy"><option value="">（不复制，建空白）</option>' + copyOptions + "</select></label>",
    '<div class="inline-form-actions"><button class="mini-button" id="sc-ok" type="button">创建</button><button class="mini-button" id="sc-cancel" type="button">取消</button></div>',
  ].join("");
  elements.scriptList.before(host);
  document.getElementById("sc-cancel").addEventListener("click", removeScriptCreateForm);
  document.getElementById("sc-ok").addEventListener("click", createScript);
}

async function createScript() {
  const typeNode = document.getElementById("sc-type");
  const nameNode = document.getElementById("sc-name");
  const copyNode = document.getElementById("sc-copy");
  if (!typeNode || state.busy) return;
  const payload = {
    type: typeNode.value,
    name: (nameNode ? nameNode.value : "").trim(),
    copyFrom: copyNode ? copyNode.value : "",
  };
  state.busy = true;
  try {
    const created = await postApi("script/create", payload);
    showToast("已新建托管项");
    removeScriptCreateForm();
    await loadOverview();
    if (created.scriptId) await selectScript(created.scriptId);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    state.busy = false;
  }
}

async function deleteScript() {
  const scriptId = state.selectedScript;
  const script = (state.overview ? state.overview.scripts || [] : []).find((item) => item.uid === scriptId);
  if (!scriptId || !script) return;
  if (!window.confirm("删掉托管项「" + script.name + "」？它下面的账号和用户目录会一起删掉，删了没法撤回。")) return;
  try {
    await postApi("script/delete", { scriptId });
    showToast("已删除托管项");
    state.selectedScript = null;
    state.users = [];
    await loadOverview();
    renderUsers();
  } catch (error) {
    showToast(error.message, true);
  }
}

function commitWebhookField(target) {
  const editing = state.editingWebhook;
  if (!editing) return;
  const path = target.dataset.webhookPath;
  if (!path) return;
  const parts = path.split(".");
  let node = editing.data;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    if (!node[key] || typeof node[key] !== "object") node[key] = {};
    node = node[key];
  }
  const last = parts[parts.length - 1];
  node[last] = target.type === "checkbox" ? target.checked : target.value;
}

async function openScriptDrawer() {
  const scriptId = state.selectedScript;
  if (!scriptId) {
    showToast("先选一个托管项", true);
    return;
  }
  state.scriptFoldOpen = null;
  if (elements.scriptForm) elements.scriptForm.innerHTML = "";
  // 账号抽屉和托管抽屉是两块独立界面，同一时间只留一个；账号那边有改动就先问一句。
  if (!elements.drawer.classList.contains("is-hidden")) {
    if (drawerDirty()) {
      const choice = await askConfirm("账号配置还有没保存的改动，要保存吗？", ["cancel", "discard", "save"]);
      if (choice === "cancel") return;
      if (choice === "save") await saveEditor();
    }
    closeDrawer();
  }
  const script = (state.overview ? state.overview.scripts || [] : []).find((item) => item.uid === scriptId);
  state.scriptDrawerScript = scriptId;
  state.scriptEditing = null;
  state.scriptSnapshot = "";
  elements.scriptDrawerTitle.textContent = ((script || {}).name || scriptId) + " · 托管配置";
  if (elements.scriptSaveState) elements.scriptSaveState.textContent = "";
  elements.scriptForm.innerHTML = '<p class="empty">读取中…</p>';
  elements.scriptJson.value = "";
  elements.scriptDrawer.classList.remove("is-hidden");
  await loadScriptIntoDrawer();
}

async function selectScript(uid) {
  state.selectedScript = uid;
  render();
  const script = (state.overview?.scripts || []).find((item) => item.uid === uid);
  elements.detailTitle.textContent = script ? `${script.name} 的账号` : "账号";
  elements.userCreate.classList.toggle("is-hidden", !script || !featureOn("accounts"));
  if (elements.scriptConfig) {
    elements.scriptConfig.classList.toggle("is-hidden", !script || !featureOn("scripts"));
  }
  if (elements.scriptStart) {
    elements.scriptStart.classList.toggle("is-hidden", !script || !featureOn("scripts"));
  }
  if (elements.startMode) {
    elements.startMode.classList.toggle("is-hidden", !script || !featureOn("scripts"));
  }
  if (state.editing && state.editing.scriptId !== uid) closeDrawer();
  try {
    const data = await callApi("users", { scriptId: uid });
    state.users = data.users || [];
  } catch (error) {
    state.users = [];
    setError(error.message);
  }
  renderUsers();
}

// 配置基线的英文枚举（shared / independent / native）在列表里换成中文。
function configBaseLabel(base) {
  const key = String(base || "shared");
  if (key === "native") return "原生";
  if (key === "independent") return "独立";
  if (key === "shared") return "共享";
  return key;
}
function renderUsers() {
  if (!state.selectedScript) {
    elements.userList.innerHTML = '<li class="empty">先选左边的托管项。</li>';
    return;
  }
  if (!state.users.length) {
    elements.userList.innerHTML = '<li class="empty">这个托管项下面还没有账号。</li>';
    return;
  }
  const canManage = featureOn("accounts");
  elements.userList.innerHTML = state.users
    .map(
      (user) => `<li class="user-item">
        <div>
          <div class="user-name">${escapeHtml(user.name)}</div>
          <div class="user-meta">${escapeHtml(configBaseLabel(user.base))} · 覆写${user.quickConfig ? "开" : "关"}${user.status ? "" : " · 已停用"}</div>
        </div>
        ${canManage ? `<div class="user-actions">
          <button class="mini-button" data-toggle="${escapeHtml(user.uid)}" data-next="${user.status ? "0" : "1"}" type="button">${user.status ? "停用" : "启用"}</button>
          <button class="mini-button" data-edit="${escapeHtml(user.uid)}" type="button">编辑</button>
          <button class="mini-button" data-clone="${escapeHtml(user.uid)}" type="button">克隆</button>
          <button class="mini-button is-danger" data-delete="${escapeHtml(user.uid)}" type="button"><i class=&quot;mdi mdi-delete-outline&quot;></i> 删除</button>
        </div>` : ""}
      </li>`,
    )
    .join("");

  elements.userList.querySelectorAll("[data-edit]").forEach((node) => {
    node.addEventListener("click", () => openEditor(node.dataset.edit));
  });
  elements.userList.querySelectorAll("[data-clone]").forEach((node) => {
    node.addEventListener("click", () => cloneUser(node.dataset.clone));
  });
  elements.userList.querySelectorAll("[data-delete]").forEach((node) => {
    node.addEventListener("click", () => deleteUser(node.dataset.delete));
  });
  elements.userList.querySelectorAll("[data-toggle]").forEach((node) => {
    node.addEventListener("click", () =>
      toggleUserStatus(node.dataset.toggle, node.dataset.next === "1"),
    );
  });
}

// 列表行上的启用/停用开关：只改 Info.Status，不动其它配置。
async function toggleUserStatus(userId, next) {
  const scriptId = state.selectedScript || "";
  if (!scriptId || state.busy) return;
  state.busy = true;
  try {
    await postApi("user/status", { scriptId, userId, status: next });
  } catch (error) {
    state.busy = false;
    setError(error.message);
    return;
  }
  state.busy = false;
  showToast(next ? "账号已启用" : "账号已停用");
  const editing = state.editing;
  if (editing && editing.userId === userId && editing.data) {
    const wasClean = elements.json && state.editSnapshot === elements.json.value;
    editing.data.Info = editing.data.Info || {};
    editing.data.Info.Status = next;
    if (elements.fieldStatus) elements.fieldStatus.checked = next;
    if (elements.json) elements.json.value = JSON.stringify(editing.data, null, 2);
    if (wasClean) state.editSnapshot = elements.json ? elements.json.value : state.editSnapshot;
  }
  try {
    const data = await callApi("users", { scriptId });
    state.users = data.users || [];
  } catch (error) {
    setError(error.message);
    return;
  }
  renderUsers();
}
async function createUser() {
  const scriptId = state.selectedScript;
  if (!scriptId || state.busy) return;
  const name = window.prompt("新账号名", "新用户");
  if (name === null) return;
  try {
    const created = await postApi("user/create", { scriptId, name: name.trim() });
    showToast(`已新建「${created.name || name}」`);
    await selectScript(scriptId);
  } catch (error) {
    showToast(error.message, true);
  }
}

async function deleteUser(userId) {
  const scriptId = state.selectedScript;
  const target = state.users.find((item) => item.uid === userId);
  if (!scriptId || !target) return;
  if (!window.confirm(`删掉账号「${target.name}」？MAS 里的配置和用户目录会一起删掉。`)) return;
  try {
    await postApi("user/delete", { scriptId, userId });
    showToast(`已删除「${target.name}」`);
    await selectScript(scriptId);
  } catch (error) {
    showToast(error.message, true);
  }
}

async function moveScript(uid, delta) {
  const scripts = (state.overview && state.overview.scripts) || [];
  const order = scripts.map((item) => item.uid);
  const from = order.indexOf(uid);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= order.length) return;
  order.splice(to, 0, order.splice(from, 1)[0]);
  try {
    await postApi("script/order", { indexList: order });
    await loadOverview();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function startScript() {
  if (!state.selectedScript) return;
  const mode = (elements.startMode && elements.startMode.value) || "AutoProxy";
  try {
    const result = await postApi("dispatch/start", {
      scriptId: state.selectedScript,
      mode: mode,
    });
    showToast(`已启动，任务 ${result.taskId || "(无 ID)"}`);
    await loadOverview();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function stopTask(taskId) {
  try {
    await postApi("dispatch/stop", { taskId });
    showToast("已请求停止");
    await loadOverview();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function cloneUser(sourceId) {
  const scriptId = state.selectedScript;
  if (!scriptId) return;
  const source = state.users.find((item) => item.uid === sourceId);
  const name = window.prompt("新账号名", `${source?.name || "账号"} 副本`);
  if (name === null) return;
  try {
    const created = await postApi("user/clone", {
      scriptId,
      sourceUserId: sourceId,
      name,
    });
    showToast(`已克隆为「${created.name}」`);
    await selectScript(scriptId);
  } catch (error) {
    showToast(error.message, true);
  }
}

async function openEditor(userId) {
  const scriptId = state.selectedScript;
  if (!scriptId) return;
  state.scriptDrawerScript = "";
  try {
    const data = await postApi("user/detail", { scriptId, userId });
    state.editing = { scriptId, userId, data: data.config || {}, plans: data.plans || [] };
    state.depotItems = null;
    state.cultivateOps = null;
    state.taskFoldScope = "";
    state.taskFoldOpen = [];
    state.customInfrastFiles = null;
    state.maaendNativeUser = null;
    state.supplySearch = "";
    state.supplyCat = "all";
    state.supplyOnlySet = false;
    if (state.maafwScript !== scriptId) {
      state.maafwDefs = null;
      state.maafwScript = "";
      state.maafwOpenTasks = [];
      state.whimboxScript = "";
      state.whimboxCatalog = null;
      state.oknteScript = "";
      state.oknteFiles = null;
      state.oknteDirty = {};
    }
    if (elements.infrastList) elements.infrastList.innerHTML = "";
    if (elements.infrastDir) elements.infrastDir.value = "";
    elements.drawerTitle.textContent = state.editing.data.Info?.Name || userId;
    elements.drawer.classList.remove("is-hidden");
    switchTab("basic");
    syncFormFromData();
    state.editSnapshot = elements.json.value;
    elements.saveState.textContent = "";
  } catch (error) {
    showToast(error.message, true);
  }
}

function syncFormFromData() {
  const info = state.editing?.data?.Info || {};
  elements.fieldName.value = info.Name || "";
  elements.fieldStatus.checked = info.Status !== false;
  elements.fieldQuick.checked = info.IfQuickConfig !== false;
  elements.fieldBase.value = info.Base || "shared";
  elements.json.value = JSON.stringify(state.editing?.data || {}, null, 2);
  renderInfrastCurrent();
  autoScanInfrast();
  renderTaskForm();
}

function syncDataFromForm() {
  const data = state.editing?.data;
  if (!data) return;
  data.Info = data.Info || {};
  data.Info.Name = elements.fieldName.value.trim();
  data.Info.Status = elements.fieldStatus.checked;
  data.Info.IfQuickConfig = elements.fieldQuick.checked;
  data.Info.Base = elements.fieldBase.value;
  elements.json.value = JSON.stringify(data, null, 2);
}

function fillStageOptions() {
  state.stageList = STAGE_OPTIONS.map(([value, label]) => ({ value, label }));
  elements.stageOptions.innerHTML = STAGE_OPTIONS.map(
    ([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`,
  ).join("");
}

async function loadStageOptions() {
  fillStageOptions();
  try {
    const data = await callApi("stage/options", {});
    const stages = data.stages || [];
    state.stageExtra = stages;
    if (!stages.length) return;
    const labelMap = new Map();
    stages.forEach((item) => {
      if (item && item.value) labelMap.set(String(item.value), item.label || item.value);
    });
    const merged = STAGE_OPTIONS.map(([value, label]) => [value, labelMap.get(value) || label]);
    const known = new Set(STAGE_OPTIONS.map(([value]) => value));
    stages.forEach((item) => {
      if (!item || !item.value) return;
      const value = String(item.value);
      if (known.has(value)) return;
      known.add(value);
      merged.push([value, item.label || value]);
    });
    state.stageList = merged.map(([value, label]) => ({ value, label }));
    elements.stageOptions.innerHTML = merged
      .map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`)
      .join("");
  } catch (error) {
    // 拿不到就继续用本地兜底列表
  }
}

function selectOptions(options, current) {
  const values = options.map(([value]) => String(value));
  let html = options
    .map(
      ([value, label]) =>
        `<option value="${escapeHtml(value)}"${String(current) === String(value) ? " selected" : ""}>${escapeHtml(label)}</option>`,
    )
    .join("");
  if (current != null && current !== "" && !values.includes(String(current))) {
    html = `<option value="${escapeHtml(current)}" selected>${escapeHtml(current)}</option>` + html;
  }
  return html;
}

function stageOptionsHtml(current) {
  const list = state.stageList || STAGE_OPTIONS.map(([value, label]) => ({ value, label }));
  const raw = current == null ? "" : String(current);
  const values = list.map((item) => String(item.value));
  let html = "";
  if (raw && !values.includes(raw)) {
    html += '<option value="' + escapeHtml(raw) + '" selected>' + escapeHtml(raw) + "（当前值）</option>";
  }
  html += list
    .map(function (item) {
      const val = String(item.value);
      return (
        '<option value="' + escapeHtml(val) + '"' + (raw === val ? " selected" : "") + ">" +
        escapeHtml(item.label || val) +
        "</option>"
      );
    })
    .join("");
  html += '<option value="__custom">＋ 自定义关卡代码…</option>';
  return html;
}
function stageModeOptions(current, plans) {
  const list = [["Fixed", "固定关卡"]].concat(
    plans.map((plan) => [plan.uid, plan.name || plan.uid]),
  );
  return selectOptions(list, current || "Fixed");
}

function taskControl(field, group, value, plans) {
  const attrs = `data-group="${group}" data-key="${field.key}"`;
  const raw = value == null ? "" : String(value);
  switch (field.type) {
    case "stageMode":
      return `<select class="task-input" ${attrs}>${stageModeOptions(raw, plans)}</select>`;
    case "stage":
      return '<select class="task-input" ' + attrs + ' data-stage="1">' + stageOptionsHtml(raw) + "</select>";
    case "select":
      return `<select class="task-input" ${attrs}>${selectOptions(field.options, raw)}</select>`;
    case "number":
      return `<input class="task-input" type="number" ${attrs} value="${escapeHtml(raw)}" min="${field.min}" max="${field.max}" />`;
    case "json":
      return `<textarea class="task-input task-json" rows="4" spellcheck="false" ${attrs}>${escapeHtml(raw)}</textarea>`;
    case "readonly":
      return `<input class="task-input" type="text" readonly value="${escapeHtml(raw)}" />`;
    default:
      return `<input class="task-input" type="text" ${attrs} value="${escapeHtml(raw)}" />`;
  }
}

// AUTO-MAS 各脚本类型的账号配置字段并不一样（MAA 26 个 Task 键、MaaEnd 32 个、
// 通用脚本干脆没有 Task 段）。所以 MAA 之外的类型统一按 CONFIG_SCHEMA 渲染：
// 字段名取模型里的 Field(description=...)，布尔给开关、Literal 给下拉、数字给数字框。
const CONFIG_SKIP_GROUPS = ["Info", "Data", "Notify", "Notify_CustomWebhooks"];

const CONFIG_GROUP_LABELS = {
  Task: "任务",
  Stage: "关卡",
  Device: "设备",
  Run: "运行策略",
  Update: "更新策略",
  Emulator: "模拟器绑定",
  OneDragon: "一条龙",
  Switch: "开关",
  Game: "游戏",
  TaskSwitch: "任务开关",
  TaskOpt: "任务选项",
  Managed: "托管",
  Control: "控制",
};

function schemaFieldsOf(schema, typeKey, path) {
  let node = schema && schema[typeKey];
  if (!node) return null;
  for (const key of path) {
    const field = node[key];
    if (!field || !field.fields) return null;
    node = field.fields;
  }
  return node;
}

function configLabel(node, key, group) {
  if (node && node.label) return node.label;
  const byGroup = group && GROUP_KEY_LABELS[group];
  if (byGroup && byGroup[key]) return byGroup[key];
  return SCRIPT_KEY_LABELS[key] || key;
}

// 模型里的 description 有的是一整段说明（比如「MAS 仅接管 DailyTask…」），
// 直接铺在表单里会把格子撑爆，截断显示、完整内容放 title。
function shortLabel(text) {
  const value = String(text || "");
  return value.length > 26 ? value.slice(0, 26) + "…" : value;
}

// AUTO-MAS 存的是英文枚举值，界面上尽量显示中文；查不到就原样显示。
const VALUE_LABELS = {
  Window: "窗口",
  Fullscreen: "全屏",
  Client: "客户端",
  Launcher: "启动器",
  MAS: "由 MAS 启动",
  MaaEnd: "由 MaaEnd 启动",
  Never: "从不",
  Always: "总是",
  Auto: "自动",
  Check: "检查更新",
  AutoInstall: "自动安装",
  Off: "关闭",
  On: "开启",
  Official: "官服",
  Bilibili: "B服",
  CN: "国服",
  "CN-Official": "国服（官方）",
  "CN-Bilibili": "国服（B服）",
  "VN-Official": "越南服",
  YoStarEN: "国际服",
  YoStarJP: "日服",
  YoStarKR: "韩服",
  "OVERSEA-America": "美服",
  "OVERSEA-Europe": "欧服",
  "OVERSEA-Asia": "亚服",
  "OVERSEA-TWHKMO": "港澳台服",
  stable: "稳定版",
  beta: "测试版",
  File: "文件",
  Folder: "文件夹",
  Regex: "正则",
  Split: "逐条",
  Globle: "汇总",
  ExitEmulator: "关闭模拟器",
  ExitGame: "关闭游戏",
  Success: "成功",
  Failure: "失败",
  CalyxGolden: "金花（经验材料）",
  CalyxCrimson: "赤花（信用点）",
  Relic: "遗器",
  Ornament: "位面饰品",
  Monday: "周一",
  Tuesday: "周二",
  Wednesday: "周三",
  Thursday: "周四",
  Friday: "周五",
  Saturday: "周六",
  Sunday: "周日",
  M7A: "三月七（M7A）",
  SRA: "SRA",
  GitHub: "GitHub",
  MirrorChyan: "Mirror 酱",
  AfterRun: "跑完后",
};

// MaaEnd（终末地）这几个字段的值是终末地自己的说法，单独翻。
const MAAEND_FIELD_VALUE_LABELS = {
  "Task.AutoCollectMode": { Distributed: "分散采集", Concentrated: "集中采集" },
  "Task.CrisisDrills": {
    AdvancedProgression1: "危境预演 1",
    AdvancedProgression2: "危境预演 2",
    AdvancedProgression3: "危境预演 3",
    AdvancedProgression4: "危境预演 4",
    AdvancedProgression5: "危境预演 5",
  },
  "Task.OperatorProgression": {
    OperatorEXP: "干员经验",
    Promotions: "干员突破",
    "T-Creds": "存续的痕迹",
    SkillUp: "技能升级",
  },
  "Task.RewardsSetOption": { RewardsSetA: "奖励组 A", RewardsSetB: "奖励组 B" },
  "Task.SanityTaskType": {
    OperatorProgression: "干员养成",
    WeaponProgression: "武器养成",
    CrisisDrills: "危境预演",
    Essence: "基质养成",
  },
  "Task.SeizeDeliveryJobsCommissionSource": {
    Unlimited: "不限",
    WulingCity: "武陵城",
    TestArea: "测试区域",
  },
  "Task.WeaponProgression": { WeaponEXP: "武器经验", WeaponTune: "武器调校" },
};

// ok-script 线（OK-WW / OK-NTE）的枚举值与任务序号，值保持英文给 AUTO-MAS，显示走中文
// MaaEnd 的「培养道具目标」（Task.SupplyPlanLimits）是一个 16 键的 JSON 字典：
// 键是上游物品 ID、值是数量（字符串）。这里按终末地中文名逐项给数字框，不用人写 JSON。
const MAAEND_SUPPLY_ITEMS = [
  { key: "SupplyPlanLimit_T_CREDS", label: "折金票" },
  { key: "SupplyPlanLimit_PROTOHEDRON", label: "协议棱柱组" },
  { key: "SupplyPlanLimit_PROTOPRISM", label: "协议棱柱" },
  { key: "SupplyPlanLimit_COGNITIVE_CARRIER_EXP", label: "认知载体经验" },
  { key: "SupplyPlanLimit_COMBAT_RECORD_EXP", label: "作战记录经验" },
  { key: "SupplyPlanLimit_PROTOSET", label: "协议圆盘组" },
  { key: "SupplyPlanLimit_PROTODISK", label: "协议圆盘" },
  { key: "SupplyPlanLimit_WEAPON_EXP", label: "武器经验" },
  { key: "SupplyPlanLimit_HEAVY_CAST_DIE", label: "重型强固模具" },
  { key: "SupplyPlanLimit_CAST_DIE", label: "强固模具" },
  { key: "SupplyPlanLimit_WARP_PLASMA_COATED_SLIDE", label: "跃迁浆体涂片" },
  { key: "SupplyPlanLimit_TRIPHASIC_NANOFLAKE", label: "三相纳米片" },
  { key: "SupplyPlanLimit_QUADRANT_FITTING_FLUID", label: "象限拟合液" },
  { key: "SupplyPlanLimit_TACHYON_SCREENING_LATTICE", label: "快子遴捡晶格" },
  { key: "SupplyPlanLimit_D96_STEEL_SAMPLE_4", label: "D96 钢样品四" },
  { key: "SupplyPlanLimit_METADIASTIMA_PHOTOEMISSION_TUBE", label: "超距辉映管" },
];

// 库存任务领取方式，值由 MaaEnd 声明，AUTO-MAS 只透传
const MAAEND_PROTOCOL_CLAIM_OPTIONS = [
  { value: "ObtainScaling1", label: "单倍领取" },
  { value: "ObtainScaling2", label: "优先双倍领取" },
];

function supplyPlanMap() {
  const raw = getConfigPath("Task.SupplyPlanLimits");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return { map: parsed, isString: true };
    } catch (error) {
      return { map: {}, isString: true };
    }
    return { map: {}, isString: true };
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return { map: raw, isString: false };
  return { map: {}, isString: true };
}

function supplyRowHtml(key, label, value) {
  return [
    '<label class="supply-row"><span title="' + escapeHtml(label) + '">' + escapeHtml(shortLabel(label)) + "</span>",
    '<input class="task-input" type="number" min="0" max="3000000000" step="1"',
    ' data-conf-path="Task.SupplyPlanLimits" data-supply-key="' + escapeHtml(key) + '"',
    ' value="' + escapeHtml(value) + '" placeholder="0" /></label>',
  ].join("");
}

const OKNTE_TASK_OPTIONS = [
  { value: "1", label: "启动游戏" },
  { value: "2", label: "日常任务" },
  { value: "3", label: "自动钓鱼" },
  { value: "4", label: "异象界域" },
  { value: "5", label: "异象追猎" },
  { value: "6", label: "音游" },
  { value: "7", label: "店长特供" },
  { value: "8", label: "粉爪大劫案" },
  { value: "9", label: "呗果智能体" },
  { value: "10", label: "自动小旋风" },
  { value: "11", label: "九百九十九夜" },
  { value: "12", label: "自动战斗检测诊断" },
  { value: "13", label: "诊断" },
  { value: "14", label: "日常领取" },
  { value: "15", label: "羁遇赠礼" },
  { value: "16", label: "一咖舍" },
  { value: "17", label: "喷泉签到" },
  { value: "18", label: "异象家具" },
  { value: "19", label: "影院约会" },
];

const OKWW_FARM_OPTIONS = [
  { value: "Tacet Suppression", label: "无音区" },
  { value: "Forgery Challenge", label: "凝素领域" },
  { value: "Simulation Challenge", label: "模拟领域" },
];

const OKWW_MATERIAL_OPTIONS = [
  { value: "Shell Credit", label: "贝币" },
  { value: "Resonator EXP", label: "角色经验" },
  { value: "Weapon EXP", label: "武器经验" },
];

const OKWW_ADDITIONAL_TASK_OPTIONS = [
  { value: "Check Weekly Garden", label: "检查周常庭院" },
  { value: "Auto Farm all Nightmare Nest", label: "刷全部梦魇巢穴" },
  { value: "Merge Echo If discarded > 1000", label: "弃置声骸超 1000 时合成" },
  { value: "Teleport and Farm 4C Echo", label: "传送并刷 4C 声骸" },
];

const SCRIPT_FIELD_VALUE_LABELS = {
  "Task.AdditionalTasks": {
    "Check Weekly Garden": "检查周常庭院",
    "Auto Farm all Nightmare Nest": "刷全部梦魇巢穴",
    "Merge Echo If discarded > 1000": "弃置声骸超 1000 时合成",
    "Teleport and Farm 4C Echo": "传送并刷 4C 声骸",
  },
  "Task.MaterialSelection": {
    "Resonator EXP": "角色经验",
    "Weapon EXP": "武器经验",
    "Shell Credit": "贝币",
  },
  "Task.WhichToFarm": {
    "Tacet Suppression": "无音区",
    "Forgery Challenge": "凝素领域",
    "Simulation Challenge": "模拟领域",
  },
};
// BetterGI 一条龙内置的 8 个配置组：Groups 数组就是执行顺序，勾上哪个就跑哪个。
const BETTERGI_BUILTIN_GROUPS = [
  "领取邮件",
  "合成树脂",
  "自动幽境危战",
  "自动地脉花",
  "自动首领讨伐",
  "自动秘境",
  "领取尘歌壶奖励",
  "领取每日奖励",
];

const ZZZOD_AFTER_DONE_OPTIONS = [
  ["无", "无"],
  ["关闭游戏", "关闭游戏"],
  ["关机", "关机"],
];
function optionValue(option) {
  if (option && typeof option === "object") return String(option.value || "");
  return String(option == null ? "" : option);
}

function optionText(option, path) {
  const raw = optionValue(option);
  const mapped = valueLabel(path, raw);
  if (mapped !== raw) return mapped;
  if (option && typeof option === "object" && option.label) return String(option.label);
  return raw;
}

function valueLabel(path, value) {
  const key = String(value == null ? "" : value);
  const byField = path && MAAEND_FIELD_VALUE_LABELS[path];
  if (byField && byField[key]) return byField[key];
  const byScript = path && SCRIPT_FIELD_VALUE_LABELS[path];
  if (byScript && byScript[key]) return byScript[key];
  if (VALUE_LABELS[key]) return VALUE_LABELS[key];
  const byCode = stageCodeLabel(key);
  if (byCode !== key) return byCode;
  return key;
}

// MaaEnd 的可选项来自 /api/scripts/maaend/options（采集路线、基质地点、控制器），
// 带中文 label；拿不到就退回 schema 里的英文枚举。
function withOptions(base, list) {
  if (!Array.isArray(list) || !list.length) return null;
  const options = list
    .filter((item) => item && item.value)
    .map((item) => ({ value: String(item.value), label: String(item.label || item.value) }));
  if (!options.length) return null;
  return Object.assign({}, base || {}, { kind: "enum", options: options });
}

function maaendFieldOverride(full, node) {
  const scriptId = (state.editing && state.editing.scriptId) || "";
  if (!scriptId || state.maaendScript !== scriptId) return null;
  const base = node || {};
  const rel = full.indexOf("Task.") === 0 ? full.slice(5) : full;
  if (rel === "DailyOnceTasks") {
    const taskList = state.maaendTasks;
    if (!Array.isArray(taskList) || !taskList.length) return null;
    return Object.assign({}, base, {
      kind: "list",
      jsonList: true,
      itemOptions: taskList.map(function (item) {
        return { value: String(item.value), label: String(item.label || item.value) };
      }),
      label: base.label || "每日只做一次的任务（做完当天跳过）",
    });
  }
  if (rel === "SupplyPlanLimits" || rel === "ProtocolSpaceObtainModeClaim" || rel === "IfSanity" || rel === "IfAutoUseSpMedication") {
    return Object.assign({}, base, { kind: "skip" });
  }
  const opt = state.maaendOptions;
  if (!opt) return null;
  if (rel === "AutoCollectRoutes" || rel === "AutoCollectCommonRoutes") {
    const groups = (opt.autoCollectGroups || []).filter((group) => group && group.configKey === rel);
    if (!groups.length) return null;
    const itemOptions = [];
    groups.forEach(function (group) {
      (group.options || []).forEach(function (item) {
        if (!item || !item.value) return;
        itemOptions.push({
          value: String(item.value),
          label: (group.regionLabel ? group.regionLabel + " · " : "") + String(item.label || item.value),
        });
      });
    });
    if (!itemOptions.length) return null;
    return Object.assign({}, base, {
      kind: "list",
      itemOptions: itemOptions,
      label: base.label || (rel === "AutoCollectRoutes" ? "稀有采集路线" : "一般采集路线"),
    });
  }
  if (rel === "AutoEssenceMenu") return withOptions(base, opt.essenceMenus);
  if (rel === "AutoEssenceSpecifiedLocation") return withOptions(base, opt.essenceLocations);
  if (rel === "AutoEssenceTargetWeapons") {
    const itemOptions = [];
    (opt.essenceTargetWeaponGroups || []).forEach(function (group) {
      (group.options || []).forEach(function (item) {
        if (!item || !item.value) return;
        itemOptions.push({
          value: String(item.value),
          label: (group.label ? group.label + " · " : "") + String(item.label || item.value),
        });
      });
    });
    if (!itemOptions.length) return null;
    return Object.assign({}, base, { kind: "list", itemOptions: itemOptions });
  }
  if (full === "Game.ControllerType") return withOptions(base, opt.controllers);
  return null;
}
// OK-WW / OK-NTE 这类 ok-script 托管项：把序号型任务、英文枚举换成中文下拉。
function scriptFieldOverride(full, node) {
  const info = currentScriptInfo();
  const type = (info && info.type) || "";
  const base = node || {};
  if (type === "OkNteConfig" && full === "Task.TaskIndex") {
    return Object.assign({}, base, {
      kind: "enum",
      options: OKNTE_TASK_OPTIONS,
      label: "启动任务（-t N）",
    });
  }
  if (type === "BetterGIConfig" && full === "OneDragon.Queue") {
    return { kind: "skip" };
  }
  if (type === "OkwwConfig" && full === "Task.AdditionalTasks") {
    return Object.assign({}, base, {
      kind: "list",
      itemOptions: OKWW_ADDITIONAL_TASK_OPTIONS,
      label: "每日任务后运行的附加任务",
    });
  }
  // OK-WW 的字段名是英文、说明又长，这里换成 MAS 界面上的叫法，让人一眼对上。
  if (type === "OkwwConfig") {
    if (full === "Task.WhichToFarm") {
      return Object.assign({}, base, {
        kind: "enum",
        options: OKWW_FARM_OPTIONS,
        label: "消耗体力刷取",
      });
    }
    if (full === "Task.MaterialSelection") {
      return Object.assign({}, base, {
        kind: "enum",
        options: OKWW_MATERIAL_OPTIONS,
        label: "刷什么材料",
      });
    }
    if (full === "Task.WhichTacetSuppressionToFarm") {
      return Object.assign({}, base, { label: "无音区序号（F2 列表里第几个）" });
    }
    if (full === "Task.WhichForgeryChallengeToFarm") {
      return Object.assign({}, base, { label: "凝素领域序号（F2 列表里第几个）" });
    }
    if (full === "Task.FarmNightmareNestForDailyEcho") {
      return Object.assign({}, base, { label: "需要时用梦魇巢穴完成日常声骸" });
    }
  }
  return null;
}
function configSelectHtml(node, value, attrs, path) {
  const current = String(value == null ? "" : value);
  const options = (node && node.options) || [];
  const values = options.map(optionValue);
  let html = options
    .map(function (opt) {
      const optValue = optionValue(opt);
      return '<option value="' + escapeHtml(optValue) + '"' + (optValue === current ? " selected" : "") + ">" + escapeHtml(optionText(opt, path)) + "</option>";
    })
    .join("");
  if (!current) {
    html = '<option value="" selected>（未设置）</option>' + html;
  }
  if (current && values.indexOf(current) < 0) {
    html = '<option value="' + escapeHtml(current) + '" selected>' + escapeHtml(valueLabel(path, current)) + "（当前值）</option>" + html;
  }
  return '<select class="task-input" ' + attrs + ">" + html + "</select>";
}

function configFieldControl(full, value, node) {
  const attrs = 'data-conf-path="' + escapeHtml(full) + '"';
  if (node && node.kind === "enum" && Array.isArray(node.options) && node.options.length) {
    return { wide: false, html: configSelectHtml(node, String(value), attrs, full) };
  }
  if (typeof value === "number") {
    const min = node && typeof node.ge === "number" ? ' min="' + node.ge + '"' : "";
    const max = node && typeof node.le === "number" ? ' max="' + node.le + '"' : "";
    return { wide: false, html: '<input class="task-input" type="number" ' + attrs + ' value="' + value + '"' + min + max + " />" };
  }
  if (typeof value === "string") {
    const isJson = (node && node.kind === "json") || /^[\s]*[[{]/.test(value);
    const hasOptions = node && Array.isArray(node.options) && node.options.length > 0;
    if (hasOptions && !isJson && value.length <= 40 && value.indexOf("\n") < 0) {
      return { wide: false, html: configSelectHtml(node, value, attrs, full) };
    }
    if (isJson || value.length > 120 || value.indexOf("\n") >= 0) {
      return {
        wide: true,
        html: '<textarea class="task-input task-json" rows="3" spellcheck="false" data-kind="json" ' + attrs + ">" + escapeHtml(value) + "</textarea>",
      };
    }
    return { wide: false, html: '<input class="task-input" type="text" ' + attrs + ' value="' + escapeHtml(value) + '" />' };
  }
  if (Array.isArray(value)) {
    const options = node && node.itemOptions;
    const allText = value.every(function (item) { return typeof item === "string"; });
    if (options && options.length && allText) {
      const chips = options
        .map(function (opt) {
          const optValue = optionValue(opt);
          const on = value.indexOf(optValue) >= 0;
          return (
            '<label class="check-chip"><input type="checkbox" value="' +
            escapeHtml(optValue) +
            '"' +
            (on ? " checked" : "") +
            " /><span>" +
            escapeHtml(optionText(opt, full)) +
            "</span></label>"
          );
        })
        .join("");
      const stringify = node && node.jsonList ? ' data-multi-string="1"' : "";
      return { wide: true, html: '<div class="multi-checks" data-multi="' + escapeHtml(full) + '"' + stringify + ">" + chips + "</div>" };
    }
    return {
      wide: true,
      html: '<textarea class="task-input task-json" rows="3" spellcheck="false" data-kind="json" ' + attrs + ">" + escapeHtml(JSON.stringify(value)) + "</textarea>",
    };
  }
  return null;
}

function renderSchemaGroup(schema, typeKey, path, bag, depth) {
  const fields = schemaFieldsOf(schema, typeKey, path) || {};
  const keys = Object.keys(bag || {});
  const toggles = [];
  const rows = [];
  const nested = [];
  keys.forEach(function (key) {
    const full0 = path.concat([key]).join(".");
    const overrideNode = maaendFieldOverride(full0, fields[key] || {}) || scriptFieldOverride(full0, fields[key] || {});
    const node = overrideNode || fields[key] || {};
    if (overrideNode && overrideNode.kind === "skip") return;
    let value = bag[key];
    if (value === null || value === undefined) {
      // 有明确候选清单的空字段（比如还没选过的采集路线）也给控件，否则用户点不动
      if (node.itemOptions && node.itemOptions.length) value = [];
      else if (node.options && node.options.length) value = "";
      else return;
    }
    if (typeof value === "object" && !Array.isArray(value)) {
      if (depth < 2 && Object.keys(value).length) nested.push([key, value, node]);
      return;
    }
    let jsonList = false;
    if (typeof value === "string" && node.jsonList && node.itemOptions && node.itemOptions.length) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          value = parsed;
          jsonList = true;
        }
      } catch (error) {
        jsonList = false;
      }
    }
    const custom = configCustomHtml(full0);
    if (custom) {
      const customLabel = configLabel(node, key, path[0]);
      rows.push(
        '<div class="task-field task-field-wide" title="' +
          escapeHtml(customLabel) +
          '"><span>' +
          escapeHtml(shortLabel(customLabel)) +
          "</span>" +
          custom +
          "</div>",
      );
      return;
    }
    const label = configLabel(node, key, path[0]);
    const full = path.concat([key]).join(".");
    if (typeof value === "boolean") {
      toggles.push(
        '<label class="toggle-item" title="' +
          escapeHtml(label) +
          '"><input type="checkbox" data-conf-path="' +
          escapeHtml(full) +
          '"' +
          (value ? " checked" : "") +
          " /><span>" +
          escapeHtml(shortLabel(label)) +
          "</span></label>",
      );
      return;
    }
    const control = configFieldControl(full, value, jsonList ? Object.assign({}, node, { jsonList: true }) : node);
    if (!control) return;
    // 多选芯片 / 长 JSON 一屏能铺几十行，折起来只留标题和已选数量，点开再改。
    const isChips = control.html.indexOf('class="multi-checks"') >= 0;
    const chipsMany = isChips && Array.isArray(value) && (node.itemOptions || []).length >= 6;
    const isBigText =
      control.html.indexOf('class="task-input task-json"') >= 0 &&
      (typeof value === "string" ? value.length > 120 : true);
    if (chipsMany || isBigText) {
      let meta = "展开编辑";
      if (isChips && Array.isArray(value)) {
        meta = "已选 " + value.length + " / 共 " + (node.itemOptions || []).length + " 项";
      }
      rows.push(
        '<details class="task-collapse"><summary title="' +
          escapeHtml(label) +
          '">' +
          '<span class="fold-title">' +
          escapeHtml(shortLabel(label)) +
          "</span>" +
          '<span class="fold-meta">' +
          escapeHtml(meta) +
          "</span></summary>" +
          '<div class="task-field task-field-wide">' +
          control.html +
          "</div></details>",
      );
      return;
    }
    rows.push(
      '<label class="task-field' +
        (control.wide ? " task-field-wide" : "") +
        '" title="' +
        escapeHtml(label) +
        '"><span>' +
        escapeHtml(shortLabel(label)) +
        "</span>" +
        control.html +
        "</label>",
    );
  });
  const parts = [];
  if (toggles.length) parts.push('<div class="toggle-grid">' + toggles.join("") + "</div>");
  if (rows.length) parts.push('<div class="task-grid">' + rows.join("") + "</div>");
  nested.forEach(function (entry) {
    const inner = renderSchemaGroup(schema, typeKey, path.concat([entry[0]]), entry[1], depth + 1);
    if (!inner) return;
    const nestedLabel = configLabel(entry[2], entry[0], path[0]);
    parts.push(
      '<details class="config-sub"><summary title="' +
        escapeHtml(nestedLabel) +
        '">' +
        escapeHtml(shortLabel(nestedLabel)) +
        "</summary>" +
        inner +
        "</details>",
    );
  });
  return parts.join("");
}

// 把一串 section.task-group 折成可点的二级折叠块，省得所有分组挤成一长条。
// mode: "none" 全收起 / "first" 只展开第一组 / 其它 全展开（true 等同于 "first"）。
function foldSections(html, mode) {
  const first = mode === true || mode === "first";
  const none = mode === "none";
  let index = 0;
  return String(html || "")
    .replace(/<section class="task-group([^"]*)">\s*<h3>/g, function (match, extra) {
      const open = none ? false : first ? index === 0 : true;
      index += 1;
      return '<details class="task-section' + (extra || "") + '"' + (open ? " open" : "") + "><summary>";
    })
    .replace(/<\/h3>/g, "</summary>")
    .replace(/<\/section>/g, "</details>");
}


// 任务页里点一下数字/加一条任务都会整块重渲染，重渲染后要把用户已经展开的折叠块还原，
// 不然每改一次就自动收起来。切换账号（或刚打开抽屉）时不还原，回到默认收起。
function taskFoldScopeKey() {
  const editing = state.editing || {};
  return String(editing.scriptId || "") + "/" + String(editing.userId || "");
}

function foldKeyOf(node) {
  const summary = node.querySelector("summary");
  if (!summary) return "";
  const title = summary.querySelector(".fold-title");
  if (title) return String(title.textContent || "").trim();
  const clone = summary.cloneNode(true);
  const meta = clone.querySelector(".fold-meta");
  if (meta) meta.remove();
  return String(clone.textContent || "").trim();
}

function collectOpenFolds() {
  if (!elements.taskForm) return [];
  const out = [];
  elements.taskForm.querySelectorAll("details[open]").forEach(function (node) {
    const key = foldKeyOf(node);
    if (key && out.indexOf(key) < 0) out.push(key);
  });
  return out;
}

function restoreOpenFolds(keys) {
  if (!elements.taskForm || !keys || !keys.length) return;
  const wanted = new Set(keys);
  elements.taskForm.querySelectorAll("details").forEach(function (node) {
    const key = foldKeyOf(node);
    if (key && wanted.has(key)) node.open = true;
  });
}
// 有些脚本的任务参数不在 Stage / Task 段里，而是藏在 Info 里（BAAH 就是这种）。
// 这里按类型点名要哪几个键，避免把账号名、启用状态这些基础字段也搬进任务页。
const TASK_EXTRA_FIELDS = {
  BAAHConfig: {
    group: "Info",
    title: "BAAH 活动与关卡策略",
    keys: ["ActivityLineType", "IfEventFirst", "StageMode", "ConfigName"],
    hint: "BAAH 的每日任务内容写在它自己的配置文件里；这里能改的是按哪个服排活动、活动关是否优先、以及用哪份关卡计划表。",
  },
  GeneralConfig: {
    group: "Info",
    title: "通用脚本运行策略",
    keys: ["IfScriptBeforeTask", "ScriptBeforeTask", "IfScriptAfterTask", "ScriptAfterTask", "RemainedDay"],
    hint: "通用脚本没有任务参数（做什么由脚本自己决定），这里能配的是任务前后要不要先跑一段批处理，以及账号剩余天数提醒。",
  },
};

// SRC / HSR 这类星穹铁道脚本的关卡值是长英文代码（Calyx_Crimson_... / Cavern_of_Corrosion_...），
// 前缀翻成中文，后面的专名保留原文，至少能一眼看出是金花、赤花还是隧洞。
const STAGE_CODE_RULES = [
  [/^Calyx_Golden_Memories_(.+)$/, "金花·回忆（$1）"],
  [/^Calyx_Golden_Aether_(.+)$/, "金花·以太（$1）"],
  [/^Calyx_Golden_Treasures_(.+)$/, "金花·藏宝（$1）"],
  [/^Calyx_Crimson_(.+)$/, "赤花·$1"],
  [/^Stagnant_Shadow_(.+)$/, "凝滞之影·$1"],
  [/^Cavern_of_Corrosion_Path_of_(.+)$/, "侵蚀隧洞·$1 之径"],
  [/^Divergent_Universe_(.+)$/, "差分宇宙·$1"],
  [/^Echo_of_War_(.+)$/, "历战余响·$1"],
  [/^Simulated_Universe_World_(.+)$/, "模拟宇宙·世界 $1"],
];

function stageCodeLabel(value) {
  const key = String(value == null ? "" : value);
  for (let i = 0; i < STAGE_CODE_RULES.length; i += 1) {
    const rule = STAGE_CODE_RULES[i];
    if (rule[0].test(key)) return key.replace(rule[0], rule[1]);
  }
  return key;
}

// ---- Whimbox（奇想盒）一条龙编排 ----

// 奇想盒的账号配置里，Task.Tasks 是「步骤开关覆盖集」、Task.Options 是「目标/参数覆盖集」，
// 两个都是 JSON 字符串，只存用户显式改过的键；键集来自它自己的安装目录（AUTO-MAS 运行时转换）。
function whimboxMap(raw) {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw;
  const text = String(raw == null ? "" : raw).trim();
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
}

function whimboxCatalogNow() {
  const scriptId = (state.editing && state.editing.scriptId) || "";
  if (!scriptId || state.whimboxScript !== scriptId) return null;
  return state.whimboxCatalog || null;
}

function loadWhimboxCatalog() {
  const info = currentScriptInfo();
  const scriptId = (state.editing && state.editing.scriptId) || "";
  if (!info || String(info.type || "") !== "WhimboxConfig" || !scriptId) return;
  if (state.whimboxScript === scriptId) return;
  state.whimboxScript = scriptId;
  state.whimboxCatalog = null;
  callApi("whimbox/catalog", { scriptId: scriptId })
    .then(function (data) {
      if (!state.editing || state.editing.scriptId !== scriptId) return;
      state.whimboxCatalog = (data && data.catalog) || null;
      renderTaskForm();
    })
    .catch(function (error) {
      if (!state.editing || state.editing.scriptId !== scriptId) return;
      state.whimboxCatalog = null;
      renderTaskForm();
      showToast("读取奇想盒任务目录失败：" + (error && error.message ? error.message : error), true);
    });
}

function whimboxOptionValue(optionsMap, opt) {
  if (Object.prototype.hasOwnProperty.call(optionsMap, opt.key)) return optionsMap[opt.key];
  return opt.default;
}

function whimboxOptionControl(opt, value) {
  const attrs = 'data-whim-opt="' + escapeHtml(opt.key) + '"';
  if (opt.type === "bool") {
    return "<input type=\"checkbox\" " + attrs + (value ? " checked" : "") + " />";
  }
  if (opt.type === "int") {
    return "<input class=\"task-input\" type=\"number\" " + attrs + " value=\"" + (value == null ? "" : escapeHtml(value)) + "\" />";
  }
  if (opt.type === "select") {
    const current = value == null ? "" : String(value);
    const choices = opt.choices || [];
    let html = choices
      .map(function (choice) {
        return "<option value=\"" + escapeHtml(choice) + "\"" + (choice === current ? " selected" : "") + ">" + escapeHtml(valueLabel("Whimbox." + opt.key, choice)) + "</option>";
      })
      .join("");
    if (!current) html = "<option value=\"\" selected>（用上游默认）</option>" + html;
    else if (choices.indexOf(current) < 0) html = "<option value=\"" + escapeHtml(current) + "\" selected>" + escapeHtml(valueLabel("Whimbox." + opt.key, current)) + "（当前值）</option>" + html;
    return "<select class=\"task-input\" " + attrs + ">" + html + "</select>";
  }
  if (opt.type === "multi_select") {
    const picked = Array.isArray(value) ? value.map(String) : value == null || value === "" ? [] : [String(value)];
    const choices = opt.choices || [];
    const items = choices.map(function (choice) {
      return "<label class=\"chip\"><input type=\"checkbox\" value=\"" + escapeHtml(choice) + "\"" + (picked.indexOf(choice) >= 0 ? " checked" : "") + " /><span>" + escapeHtml(valueLabel("Whimbox." + opt.key, choice)) + "</span></label>";
    });
    return "<div class=\"chip-grid\" data-whim-multi=\"" + escapeHtml(opt.key) + "\">" + items.join("") + "</div>";
  }
  const text = value == null ? "" : String(value);
  if (text.length > 80 || text.indexOf("\n") >= 0) {
    return "<textarea class=\"task-input task-json\" rows=\"2\" " + attrs + ">" + escapeHtml(text) + "</textarea>";
  }
  return "<input class=\"task-input\" type=\"text\" " + attrs + " value=\"" + escapeHtml(text) + "\" />";
}

function whimboxResetButton(key, kind, overridden) {
  if (!overridden) return "";
  return "<button class=\"mini-button\" type=\"button\" data-whim-reset=\"" + escapeHtml(key) + "\" data-whim-kind=\"" + kind + "\" title=\"删掉这条覆盖，用回上游默认\">默认</button>";
}

function renderWhimboxTaskForm(data) {
  const task = (data && data.Task) || {};
  const tasksMap = whimboxMap(task.Tasks);
  const optionsMap = whimboxMap(task.Options);
  const catalog = whimboxCatalogNow();
  const intro =
    "奇想盒做什么写在它自己的配置里，这里只保存你显式改过的覆盖项，没动过的仍然按上游默认跑。" +
    (catalog && catalog.version ? "上游版本 " + catalog.version + "。" : "");
  if (!catalog) {
    return "<p class=\"hint\">正在读取奇想盒的任务目录（步骤开关 + 目标参数）…</p>";
  }
  const steps = catalog.steps || [];
  const options = catalog.options || [];
  if (!steps.length && !options.length) {
    return (
      "<p class=\"hint\">奇想盒没返回任务目录：" +
      escapeHtml(catalog.message || "上游安装目录里没有可解析的配置模板，可能还没装好或者版本太旧") +
      "。这种情况下只能到「基础」页的完整配置 JSON 里手改 Task.Tasks / Task.Options。</p>"
    );
  }
  const parts = [];
  parts.push("<p class=\"hint\">" + escapeHtml(intro) + "</p>");
  if (steps.length) {
    const rows = steps.map(function (step) {
      const overridden = Object.prototype.hasOwnProperty.call(tasksMap, step.key);
      const on = overridden ? tasksMap[step.key] !== false : true;
      return (
        "<div class=\"whim-step" + (on ? "" : " is-off") + "\" title=\"" + escapeHtml(step.section || step.name) + "\">" +
        "<label class=\"toggle-item\"><input type=\"checkbox\" data-whim-step=\"" + escapeHtml(step.key) + "\"" + (on ? " checked" : "") + " /><span>" +
        escapeHtml(step.name) +
        "</span></label>" +
        whimboxResetButton(step.key, "task", overridden) +
        "</div>"
      );
    });
    parts.push("<section class=\"task-group\"><h3>步骤开关</h3><div class=\"toggle-grid\">" + rows.join("") + "</div></section>");
  }
  if (options.length) {
    const bySection = new Map();
    options.forEach(function (opt) {
      const key = opt.section || "其他参数";
      if (!bySection.has(key)) bySection.set(key, []);
      bySection.get(key).push(opt);
    });
    const sections = [];
    bySection.forEach(function (list, sectionName) {
      const rows = list.map(function (opt) {
        const overridden = Object.prototype.hasOwnProperty.call(optionsMap, opt.key);
        const value = whimboxOptionValue(optionsMap, opt);
        const wide = opt.type === "multi_select" || opt.type === "text";
        return (
          "<div class=\"task-field" + (wide ? " task-field-wide" : "") + "\" title=\"" + escapeHtml(opt.key) + "\"><span>" +
          escapeHtml(opt.name) +
          whimboxResetButton(opt.key, "option", overridden) +
          "</span>" +
          whimboxOptionControl(opt, value) +
          "</div>"
        );
      });
      sections.push("<details class=\"config-sub\"><summary>" + escapeHtml(sectionName) + "</summary><div class=\"task-grid\">" + rows.join("") + "</div></details>");
    });
    parts.push("<section class=\"task-group\"><h3>目标 / 参数</h3>" + sections.join("") + "</section>");
  }
  return foldSections(parts.join(""), true);
}

function writeWhimboxMap(field, map) {
  return setConfigPath("Task." + field, JSON.stringify(map));
}

function handleWhimboxChange(target) {
  if (!target || !target.getAttribute) return false;
  const stepKey = target.getAttribute("data-whim-step");
  if (stepKey) {
    const data = (state.editing && state.editing.data) || {};
    const map = whimboxMap(data.Task && data.Task.Tasks);
    map[stepKey] = target.checked === true;
    writeWhimboxMap("Tasks", map);
    const row = target.closest ? target.closest(".whim-step") : null;
    if (row) row.classList.toggle("is-off", !target.checked);
    return true;
  }
  const multi = target.closest ? target.closest("[data-whim-multi]") : null;
  if (multi) {
    const data = (state.editing && state.editing.data) || {};
    const map = whimboxMap(data.Task && data.Task.Options);
    const key = multi.getAttribute("data-whim-multi");
    map[key] = Array.prototype.slice.call(multi.querySelectorAll("input:checked")).map(function (node) { return node.value; });
    writeWhimboxMap("Options", map);
    return true;
  }
  const optKey = target.getAttribute("data-whim-opt");
  if (!optKey) return false;
  const data = (state.editing && state.editing.data) || {};
  const map = whimboxMap(data.Task && data.Task.Options);
  let value;
  if (target.type === "checkbox") value = target.checked === true;
  else if (target.type === "number") {
    const num = Number(target.value);
    value = target.value === "" ? null : Number.isFinite(num) ? num : null;
  } else value = target.value === "" ? null : target.value;
  if (value === null) delete map[optKey];
  else map[optKey] = value;
  writeWhimboxMap("Options", map);
  return true;
}

function handleWhimboxClick(node) {
  const reset = node && node.closest ? node.closest("[data-whim-reset]") : null;
  if (!reset) return false;
  const key = reset.getAttribute("data-whim-reset");
  const kind = reset.getAttribute("data-whim-kind");
  const data = (state.editing && state.editing.data) || {};
  if (kind === "task") {
    const map = whimboxMap(data.Task && data.Task.Tasks);
    delete map[key];
    writeWhimboxMap("Tasks", map);
  } else {
    const map = whimboxMap(data.Task && data.Task.Options);
    delete map[key];
    writeWhimboxMap("Options", map);
  }
  renderTaskForm();
  return true;
}

function renderSchemaTaskForm(scriptType, data) {
  const groups = Object.keys(data || {}).filter(function (key) {
    if (CONFIG_SKIP_GROUPS.indexOf(key) >= 0) return false;
    const bag = data[key];
    return bag && typeof bag === "object" && !Array.isArray(bag) && Object.keys(bag).length > 0;
  });
  // MaaEnd 的任务页分成三段排：先是要做什么（Task 里的开关），再是理管 / 库存目标，
  // 剩下的采集路线、基质、危境这类细节参数放最后。其余脚本还是按原来的分组顺序。
  const splitToggles = scriptType === "MaaEndConfig";
  const headParts = [];
  const tailParts = [];
  function sectionOf(title, inner) {
    return (
      '<section class="task-group"><h3>' +
      escapeHtml(title) +
      "</h3>" +
      inner +
      "</section>"
    );
  }
  const html = groups
    .map(function (group) {
      const bag = data[group];
      const title = CONFIG_GROUP_LABELS[group] || group;
      if (splitToggles) {
        const boolBag = {};
        const restBag = {};
        Object.keys(bag).forEach(function (key) {
          if (typeof bag[key] === "boolean") boolBag[key] = bag[key];
          else restBag[key] = bag[key];
        });
        if (Object.keys(boolBag).length && Object.keys(restBag).length) {
          const toggleInner = renderSchemaGroup(CONFIG_SCHEMA, scriptType, [group], boolBag, 0);
          const restInner = renderSchemaGroup(CONFIG_SCHEMA, scriptType, [group], restBag, 0);
          if (toggleInner) headParts.push(sectionOf(title, toggleInner));
          if (restInner) tailParts.push(sectionOf(title + "参数", restInner));
          return "";
        }
      }
      const inner = renderSchemaGroup(CONFIG_SCHEMA, scriptType, [group], bag, 0);
      if (!inner) return "";
      return sectionOf(title, inner);
    })
    .filter(Boolean)
    .join("");
  const extra = TASK_EXTRA_FIELDS[scriptType];
  let extraHtml = "";
  if (extra && data && data[extra.group]) {
    const source = data[extra.group];
    const bag = {};
    extra.keys.forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(source, key)) bag[key] = source[key];
    });
    const inner = renderSchemaGroup(CONFIG_SCHEMA, scriptType, [extra.group], bag, 0);
    if (inner) {
      extraHtml =
        '<section class="task-group"><h3>' +
        escapeHtml(extra.title) +
        "</h3>" +
        (extra.hint ? '<p class="hint">' + escapeHtml(extra.hint) + "</p>" : "") +
        inner +
        "</section>";
    }
  }
  // MaaEnd 的理管任务（执行策略 + 库存目标）夹在任务勾选和细节参数中间，和别的组一样能折叠。
  let sanity = "";
  if (scriptType === "MaaEndConfig") {
    sanity = renderMaaendSanitySection(data);
  }
  // ZZZ-OD 的分组（游戏 / 一条龙 …）默认全部收起，先给个目录感，点开再看细节。
  const collapseAll = scriptType === "ZzzOdConfig";
  const ordered = headParts.join("") + sanity + tailParts.join("") + html + extraHtml;
  const folded = foldSections(ordered, collapseAll ? "none" : "first");
  // 预备编队是账号级的（读 zzz-od 的 team.yml），不参与分组折叠，单独一块。
  if (scriptType === "ZzzOdConfig") return folded + renderZzzTeamsBlock();
  return folded;
}

function configWriteRoot() {
  return state.configRoot || (state.editing && state.editing.data) || null;
}

function syncConfigTextareas() {
  const pairs = [
    [elements.json, state.editing && state.editing.data],
    [elements.scriptJson, state.scriptEditing && state.scriptEditing.data],
    [elements.emulatorJson, state.emulatorData],
  ];
  pairs.forEach(function (pair) {
    const node = pair[0];
    const data = pair[1];
    if (node && data) node.value = JSON.stringify(data, null, 2);
  });
}

function getConfigPath(pathStr) {
  const data = configWriteRoot();
  if (!data) return undefined;
  const parts = String(pathStr || "").split(".").filter(Boolean);
  let node = data;
  for (let i = 0; i < parts.length; i += 1) {
    if (!node || typeof node !== "object") return undefined;
    node = node[parts[i]];
  }
  return node;
}

function setConfigPath(pathStr, value) {
  const data = configWriteRoot();
  if (!data) return false;
  const parts = String(pathStr || "").split(".").filter(Boolean);
  if (!parts.length) return false;
  let node = data;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const next = node[parts[i]];
    if (!next || typeof next !== "object") node[parts[i]] = {};
    node = node[parts[i]];
  }
  node[parts[parts.length - 1]] = value;
  syncConfigTextareas();
  return true;
}

// schema 生成的控件分两种：普通字段带 data-conf-path，多选芯片的勾选框在 [data-multi] 里。
function isSchemaField(target) {
  if (!target) return false;
  if (target.dataset && target.dataset.scriptPath) return true;
  if (target.getAttribute && target.getAttribute("data-conf-path")) return true;
  return Boolean(target.closest && target.closest("[data-multi]"));
}
function commitConfigValue(target) {
  const supplyKey = target.getAttribute && target.getAttribute("data-supply-key");
  if (supplyKey) {
    const pathStr = target.getAttribute("data-conf-path") || "Task.SupplyPlanLimits";
    const parsed = supplyPlanMap();
    const map = Object.assign({}, parsed.map);
    const raw = String(target.value || "").trim();
    if (raw === "") delete map[supplyKey];
    else map[supplyKey] = raw;
    setConfigPath(pathStr, parsed.isString ? JSON.stringify(map) : map);
    return true;
  }
  const multi = target.closest ? target.closest("[data-multi]") : null;
  if (multi) {
    const picked = Array.prototype.slice
      .call(multi.querySelectorAll("input:checked"))
      .map(function (node) { return node.value; });
    const asString = multi.getAttribute("data-multi-string") === "1";
    setConfigPath(multi.getAttribute("data-multi"), asString ? JSON.stringify(picked) : picked);
    return true;
  }
  const pathStr = target.getAttribute && target.getAttribute("data-conf-path");
  if (!pathStr) return false;
  let value;
  if (target.type === "checkbox") {
    value = target.checked;
  } else if (target.type === "number") {
    const num = Number(target.value);
    value = Number.isFinite(num) ? num : 0;
  } else if (target.dataset && target.dataset.kind === "json") {
    const raw = String(target.value || "").trim();
    try {
      value = raw ? JSON.parse(raw) : null;
      target.classList.remove("is-invalid");
    } catch (error) {
      target.classList.add("is-invalid");
      return true;
    }
  } else {
    value = target.value;
    const previous = getConfigPath(pathStr);
    if (typeof previous === "number" && value !== "" && Number.isFinite(Number(value))) {
      value = Number(value);
    }
  }
  setConfigPath(pathStr, value);
  return true;
}

const MAA_TASK_SCRIPT_TYPES = new Set(["MaaConfig"]);

function currentScriptInfo() {
  const scriptId = activeScriptId();
  return (state.overview?.scripts || []).find((item) => item.uid === scriptId) || null;
}


// ---- OK-NTE（ok-nte）任务流程配置 ----
// ok-nte 的额外参数不在账号配置里，而在 ok-nte 自己的 7 份 json 里；
// 字段结构由 AUTO-MAS 的 scripts/oknte/configs/list 下发，前端按 type 渲染。

const OKNTE_GROUP_ORDER = ["任务配置", "触发配置", "全局配置"];
const OKNTE_VALUE_LABELS = {
  Auto: "自动",
  Yes: "是",
  No: "否",
  None: "无",
  Blur: "模糊",
  Inpaint: "修复",
};

function oknteIsCurrent() {
  const info = currentScriptInfo();
  return !!(info && String(info.type || "") === "OkNteConfig");
}

function oknteKey() {
  const scriptId = (state.editing && state.editing.scriptId) || "";
  const userId = (state.editing && state.editing.userId) || "";
  return scriptId && userId ? scriptId + "/" + userId : "";
}

function loadOknteConfigs() {
  if (!oknteIsCurrent()) return;
  const key = oknteKey();
  if (!key) return;
  if (state.oknteScript === key) return;
  state.oknteScript = key;
  state.oknteFiles = null;
  state.oknteDirty = {};
  const editing = state.editing;
  postApi("oknte/configs", { scriptId: editing.scriptId, userId: editing.userId })
    .then(function (data) {
      if (!state.editing || oknteKey() !== key) return;
      state.oknteFiles = Array.isArray(data && data.files) ? data.files : [];
      state.oknteLabels = (data && data.optionLabels) || {};
      state.oknteConfigPath = (data && data.configPath) || "";
      renderTaskForm();
    })
    .catch(function (error) {
      if (!state.editing || oknteKey() !== key) return;
      state.oknteFiles = [];
      renderTaskForm();
      showToast(
        "读取 OK-NTE 配置失败：" + (error && error.message ? error.message : error),
        true
      );
    });
}

function oknteFile(filename) {
  return (state.oknteFiles || []).find(function (item) {
    return item && item.filename === filename;
  }) || null;
}

function oknteLabel(key, fallback) {
  const labels = state.oknteLabels;
  if (labels && typeof labels === "object" && typeof labels[key] === "string") return labels[key];
  return fallback;
}

function oknteOptions(list) {
  return (Array.isArray(list) ? list : []).map(function (opt) {
    if (opt && typeof opt === "object") {
      const value = opt.value !== undefined && opt.value !== null ? String(opt.value) : String(opt.key || "");
      const label = String(opt.label || opt.name || value);
      return { value: value, label: oknteLabel(value, label) };
    }
    return { value: String(opt), label: oknteLabel(String(opt), String(opt)) };
  });
}

function oknteGetPath(file, path) {
  const parts = String(path || "").split(".").filter(Boolean);
  let node = file && file.currentData;
  for (let i = 0; i < parts.length; i += 1) {
    if (!node || typeof node !== "object") return undefined;
    node = node[parts[i]];
  }
  return node;
}

function oknteSetPath(filename, path, value) {
  const file = oknteFile(filename);
  if (!file) return false;
  const parts = String(path || "").split(".").filter(Boolean);
  if (!parts.length) return false;
  if (!file.currentData || typeof file.currentData !== "object") file.currentData = {};
  let node = file.currentData;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const next = node[parts[i]];
    if (!next || typeof next !== "object") node[parts[i]] = {};
    node = node[parts[i]];
  }
  node[parts[parts.length - 1]] = value;
  state.oknteDirty[filename] = true;
  return true;
}

function oknteRoutineList(file, field) {
  const raw = oknteGetPath(file, field.name);
  const list = [];
  const seen = {};
  (Array.isArray(raw) ? raw : []).forEach(function (item) {
    if (!item || typeof item !== "object") return;
    const id = String(item.id || "");
    if (!id || seen[id]) return;
    seen[id] = true;
    list.push({ id: id, enabled: item.enabled !== false });
  });
  (Array.isArray(field.itemDefinitions) ? field.itemDefinitions : []).forEach(function (def) {
    if (!def || typeof def !== "object") return;
    const id = String(def.id || "");
    if (!id || seen[id]) return;
    seen[id] = true;
    list.push({ id: id, enabled: def.defaultEnabled === true, isNew: true, def: def });
  });
  list.forEach(function (item) {
    const def = (Array.isArray(field.itemDefinitions) ? field.itemDefinitions : []).find(function (d) {
      return d && String(d.id || "") === item.id;
    });
    item.label = String((def && (def.label || def.name)) || item.id);
    item.desc = String((def && def.description) || "");
    item.exclusiveGroup = def && def.exclusiveGroup ? String(def.exclusiveGroup) : "";
  });
  return list;
}

function oknteToggleItem(file, field, path, value) {
  return (
    "<label class=\"toggle-item\"><input type=\"checkbox\" data-oknte-kind=\"bool\"" +
    " data-oknte-file=\"" + escapeHtml(file) + "\"" +
    " data-oknte-path=\"" + escapeHtml(path) + "\"" +
    (value ? " checked" : "") +
    " /><span>" + escapeHtml(field.label || field.name) + "</span></label>"
  );
}

function oknteControl(file, field, path, value) {
  const t = String(field.type || "");
  const attrs =
    " data-oknte-file=\"" + escapeHtml(file) + "\"" +
    " data-oknte-path=\"" + escapeHtml(path) + "\"";
  if (t === "bool") return oknteToggleItem(file, field, path, !!value);
  if (t === "int" || t === "float") {
    const step = t === "float" ? (field.step || "0.01") : (field.step || "1");
    let range = " step=\"" + escapeHtml(step) + "\"";
    if (field.min !== undefined && field.min !== null) range += " min=\"" + escapeHtml(field.min) + "\"";
    if (field.max !== undefined && field.max !== null) range += " max=\"" + escapeHtml(field.max) + "\"";
    return (
      "<input class=\"task-input\" type=\"number\" data-oknte-kind=\"number\"" +
      " data-oknte-floating=\"" + (t === "float" ? "1" : "0") + "\"" + range + attrs +
      " value=\"" + escapeHtml(value === undefined || value === null ? "" : value) + "\" />"
    );
  }
  if (t === "select") {
    const options = oknteOptions(field.options);
    const current = value === undefined || value === null ? "" : String(value);
    const known = options.some(function (opt) { return opt.value === current; });
    const html = options
      .map(function (opt) {
        return (
          "<option value=\"" + escapeHtml(opt.value) + "\"" +
          (opt.value === current ? " selected" : "") + ">" +
          escapeHtml(opt.label) + "</option>"
        );
      })
      .join("");
    return (
      "<select class=\"task-input\" data-oknte-kind=\"select\"" + attrs + ">" +
      (current && !known ? "<option value=\"" + escapeHtml(current) + "\" selected>" + escapeHtml(current) + "</option>" : "") +
      (current ? "" : "<option value=\"\" selected>（未设置）</option>") +
      html +
      "</select>"
    );
  }
  if (t === "list") {
    const picked = Array.isArray(value) ? value.map(String) : [];
    const options = oknteOptions(field.options);
    if (!options.length) {
      return (
        "<input class=\"task-input\" type=\"text\" data-oknte-kind=\"text\"" + attrs +
        " value=\"" + escapeHtml(picked.join(",")) + "\" />"
      );
    }
    const chips = options
      .map(function (opt) {
        return (
          "<label class=\"chip\"><input type=\"checkbox\" data-oknte-kind=\"chip\"" +
          " data-oknte-file=\"" + escapeHtml(file) + "\"" +
          " data-oknte-path=\"" + escapeHtml(path) + "\"" +
          " value=\"" + escapeHtml(opt.value) + "\"" +
          (picked.indexOf(opt.value) >= 0 ? " checked" : "") +
          " /><span>" + escapeHtml(opt.label) + "</span></label>"
        );
      })
      .join("");
    return "<div class=\"task-chips\">" + chips + "</div>";
  }
  return (
    "<input class=\"task-input\" type=\"text\" data-oknte-kind=\"text\"" + attrs +
    " value=\"" + escapeHtml(value === undefined || value === null ? "" : value) + "\" />"
  );
}

function renderOknteRoutine(filename, field) {
  const file = oknteFile(filename);
  if (!file) return "";
  const list = oknteRoutineList(file, field);
  if (!list.length) {
    return "<p class=\"hint\">这份流程里没有可选子任务。</p>";
  }
  const rows = list
    .map(function (item, index) {
      const attrs =
        " data-oknte-file=\"" + escapeHtml(filename) + "\"" +
        " data-oknte-routine=\"" + escapeHtml(field.name) + "\"" +
        " data-oknte-item=\"" + escapeHtml(item.id) + "\"";
      const sub = item.desc
        ? "<small>" + escapeHtml(item.id) + " · " + escapeHtml(item.desc) + "</small>"
        : "<small>" + escapeHtml(item.id) + "</small>";
      const up = index === 0 ? " disabled" : "";
      const down = index === list.length - 1 ? " disabled" : "";
      return (
        "<div class=\"oknte-row" + (item.enabled ? "" : " is-off") + "\">" +
        "<label class=\"oknte-check\"><input type=\"checkbox\" data-oknte-kind=\"routine\"" + attrs +
        (item.enabled ? " checked" : "") + " /><span><b>" + escapeHtml(item.label) + "</b>" + sub + "</span></label>" +
        "<span class=\"oknte-move\">" +
        "<button type=\"button\" class=\"mini-button\" data-oknte-move=\"up\"" + attrs + up + ">↑</button>" +
        "<button type=\"button\" class=\"mini-button\" data-oknte-move=\"down\"" + attrs + down + ">↓</button>" +
        "</span></div>"
      );
    })
    .join("");
  return (
    "<div class=\"oknte-routine\" data-oknte-routine-file=\"" + escapeHtml(filename) + "\"" +
    " data-oknte-routine-field=\"" + escapeHtml(field.name) + "\">" +
    "<p class=\"hint\">勾选要跑的子任务，顺序就是执行顺序；「异象界域 / 异象追猎」互斥，开一个会关另一个。</p>" +
    rows +
    "</div>"
  );
}

function renderOknteFields(filename, fields, bag, path, depth) {
  const bools = [];
  const others = [];
  (Array.isArray(fields) ? fields : []).forEach(function (field) {
    if (!field || !field.name) return;
    const name = String(field.name);
    const full = path ? path + "." + name : name;
    const value = bag && typeof bag === "object" ? bag[name] : undefined;
    const t = String(field.type || "");
    if (t === "bool") {
      bools.push(oknteToggleItem(filename, field, full, !!value));
      return;
    }
    if (t === "routine_items") {
      others.push(renderOknteRoutine(filename, field));
      return;
    }
    if (t === "object") {
      const children = Array.isArray(field.children) ? field.children : [];
      const sub = children.length
        ? renderOknteFields(filename, children, value || {}, full, depth)
        : "<p class=\"hint\">没有可编辑字段。</p>";
      const open = depth <= 0 ? " open" : "";
      others.push(
        "<details class=\"oknte-object\"" + open + "><summary>" +
        escapeHtml(field.label || name) + "</summary>" + sub + "</details>"
      );
      return;
    }
    others.push(
      "<div class=\"task-field\"><span>" + escapeHtml(field.label || name) + "</span>" +
      oknteControl(filename, field, full, value) + "</div>"
    );
  });
  let html = "";
  if (bools.length) html += "<div class=\"toggle-grid\">" + bools.join("") + "</div>";
  if (others.length) html += others.join("");
  return html;
}

function renderOknteFileBlock(file) {
  const dirty = state.oknteDirty && state.oknteDirty[file.filename] ? " · 未保存" : "";
  const err = file.parseError
    ? "<p class=\"hint is-error\">这份配置解析失败，AUTO-MAS 读不懂，先到 MAS 里修好再来。</p>"
    : "";
  const body = file.parseError
    ? ""
    : renderOknteFields(file.filename, file.fields, file.currentData, "", 0);
  return (
    "<details class=\"oknte-file\" data-oknte-group=\"" + escapeHtml(file.group || "") + "\" open>" +
    "<summary>" + escapeHtml(file.displayName || file.filename) +
    "<span class=\"oknte-file-name\">" + escapeHtml(file.filename) + dirty + "</span></summary>" +
    err + body + "</details>"
  );
}

function renderOknteTaskForm(data) {
  if (state.oknteFiles === null || state.oknteFiles === undefined) {
    return "<p class=\"hint\">正在读取 OK-NTE 的配置文件…</p>";
  }
  if (!state.oknteFiles.length) {
    return "<p class=\"hint\">没读到 OK-NTE 的配置文件。看右下角有没有报错提示，或者到 AUTO-MAS 里确认这个账号的 QuickConfig 目录。</p>";
  }
  const groups = [];
  state.oknteFiles.forEach(function (file) {
    if (!file || !file.filename) return;
    const group = String(file.group || "其他");
    if (groups.indexOf(group) < 0) groups.push(group);
  });
  groups.sort(function (a, b) {
    const ia = OKNTE_GROUP_ORDER.indexOf(a);
    const ib = OKNTE_GROUP_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const sections = groups
    .map(function (group) {
      const blocks = state.oknteFiles
        .filter(function (file) {
          return file && file.filename && String(file.group || "其他") === group;
        })
        .map(renderOknteFileBlock)
        .join("");
      return (
        "<section class=\"task-group\"><h3>" + escapeHtml(group) + "</h3>" + blocks + "</section>"
      );
    })
    .join("");
  const bag = data && data.Task && typeof data.Task === "object" ? data.Task : null;
  let taskSection = "";
  if (bag) {
    const index = bag.TaskIndex === undefined || bag.TaskIndex === null ? "" : String(bag.TaskIndex);
    const launch = index ? "当前启动参数：-t " + index + (bag.ExitOnFinish ? " -e" : "") : "";
    taskSection =
      '<section class="task-group"><h3>启动任务与结束行为</h3>' +
      renderSchemaGroup(CONFIG_SCHEMA, "OkNteConfig", ["Task"], bag, 0) +
      (launch ? '<p class="hint">' + escapeHtml(launch) + "</p>" : "") +
      "</section>";
  }
  const dirtyCount = Object.keys(state.oknteDirty || {}).length;
  return [
    taskSection,
    "<p class=\"hint\">",
    escapeHtml(
      "OK-NTE 的任务流程和参数在它自己的配置文件里，AUTO-MAS 这边按文件下发。改完点下面的「保存 OK-NTE 配置」，只提交改过的文件。"
    ),
    "</p>",
    sections,
    "<div class=\"oknte-actions\">",
    "<button type=\"button\" class=\"primary-button\" id=\"oknte-save\">保存 OK-NTE 配置",
    dirtyCount ? "（" + dirtyCount + "）" : "",
    "</button>",
    state.oknteConfigPath
      ? "<span class=\"oknte-path\">" + escapeHtml(state.oknteConfigPath) + "</span>"
      : "",
    "</div>",
  ].join("");
}

function oknteRerenderRoutine(node) {
  const box = node.closest ? node.closest(".oknte-routine") : null;
  if (!box) return;
  const filename = box.getAttribute("data-oknte-routine-file");
  const fieldName = box.getAttribute("data-oknte-routine-field");
  const file = oknteFile(filename);
  if (!file) return;
  const field = (file.fields || []).find(function (item) {
    return item && String(item.name) === String(fieldName);
  });
  if (!field) return;
  const html = renderOknteRoutine(filename, field);
  const holder = document.createElement("div");
  holder.innerHTML = html;
  if (holder.firstElementChild) box.parentNode.replaceChild(holder.firstElementChild, box);
}

function handleOknteChange(target) {
  if (!target || !target.hasAttribute) return false;
  const filename = target.getAttribute("data-oknte-file");
  const path = target.getAttribute("data-oknte-path");
  const kind = target.getAttribute("data-oknte-kind");
  if (!filename || !kind) return false;
  if (kind === "routine") {
    const fieldName = target.getAttribute("data-oknte-routine");
    const itemId = target.getAttribute("data-oknte-item");
    const file = oknteFile(filename);
    if (!file || !fieldName || !itemId) return false;
    const field = (file.fields || []).find(function (item) {
      return item && String(item.name) === String(fieldName);
    });
    if (!field) return false;
    const list = oknteRoutineList(file, field);
    const hit = list.find(function (item) { return item.id === itemId; });
    if (!hit) return false;
    hit.enabled = !!target.checked;
    if (hit.enabled && hit.exclusiveGroup) {
      list.forEach(function (item) {
        if (item.id !== hit.id && item.exclusiveGroup === hit.exclusiveGroup) item.enabled = false;
      });
    }
    oknteSetPath(filename, fieldName, list.map(function (item) {
      return { id: item.id, enabled: !!item.enabled };
    }));
    oknteRerenderRoutine(target);
    renderOknteDirtyBadge();
    return true;
  }
  if (!path) return false;
  if (kind === "bool") {
    oknteSetPath(filename, path, !!target.checked);
    renderOknteDirtyBadge();
    return true;
  }
  if (kind === "number") {
    const raw = String(target.value || "").trim();
    const floating = target.getAttribute("data-oknte-floating") === "1";
    if (raw === "") {
      target.classList.add("is-invalid");
      return true;
    }
    const num = floating ? Number(raw) : parseInt(raw, 10);
    if (!Number.isFinite(num)) {
      target.classList.add("is-invalid");
      return true;
    }
    target.classList.remove("is-invalid");
    oknteSetPath(filename, path, num);
    renderOknteDirtyBadge();
    return true;
  }
  if (kind === "chip") {
    const box = target.closest ? target.closest("[data-oknte-chips]") : null;
    const scope = box || (target.closest ? target.closest(".task-chips") : null);
    const inputs = scope ? scope.querySelectorAll("input[data-oknte-kind=\"chip\"]") : [];
    const picked = [];
    Array.prototype.forEach.call(inputs, function (input) {
      if (input.checked && input.getAttribute("data-oknte-path") === path) picked.push(input.value);
    });
    oknteSetPath(filename, path, picked);
    renderOknteDirtyBadge();
    return true;
  }
  oknteSetPath(filename, path, String(target.value === undefined ? "" : target.value));
  renderOknteDirtyBadge();
  return true;
}

function renderOknteDirtyBadge() {
  const button = elements.taskForm ? elements.taskForm.querySelector("#oknte-save") : null;
  if (!button) return;
  const count = Object.keys(state.oknteDirty || {}).length;
  button.textContent = count ? "保存 OK-NTE 配置（" + count + "）" : "保存 OK-NTE 配置";
}

function handleOknteClick(node) {
  if (!node || !node.getAttribute) return false;
  const move = node.getAttribute("data-oknte-move");
  if (!move) return false;
  const filename = node.getAttribute("data-oknte-file");
  const fieldName = node.getAttribute("data-oknte-routine");
  const itemId = node.getAttribute("data-oknte-item");
  const file = oknteFile(filename);
  if (!file || !fieldName || !itemId) return true;
  const field = (file.fields || []).find(function (item) {
    return item && String(item.name) === String(fieldName);
  });
  if (!field) return true;
  const list = oknteRoutineList(file, field);
  const index = list.findIndex(function (item) { return item.id === itemId; });
  if (index < 0) return true;
  const to = move === "up" ? index - 1 : index + 1;
  if (to < 0 || to >= list.length) return true;
  const moved = list.slice();
  const tmp = moved[index];
  moved[index] = moved[to];
  moved[to] = tmp;
  oknteSetPath(filename, fieldName, moved.map(function (item) {
    return { id: item.id, enabled: !!item.enabled };
  }));
  oknteRerenderRoutine(node);
  renderOknteDirtyBadge();
  return true;
}

function saveOknteConfigs() {
  const editing = state.editing;
  if (!editing || !oknteIsCurrent()) return;
  const configs = {};
  const names = [];
  (state.oknteFiles || []).forEach(function (file) {
    if (!file || !file.filename) return;
    if (!state.oknteDirty || !state.oknteDirty[file.filename]) return;
    configs[file.filename] = file.currentData;
    names.push(file.displayName || file.filename);
  });
  if (!names.length) {
    showToast("没有改动，不用保存。");
    return;
  }
  postApi("oknte/save", { scriptId: editing.scriptId, userId: editing.userId, configs: configs })
    .then(function () {
      state.oknteDirty = {};
      renderTaskForm();
      showToast("已保存：" + names.join("、"));
    })
    .catch(function (error) {
      showToast(error && error.message ? error.message : "保存失败", true);
    });
}


// 终末地的可选项（采集路线 / 基质地点 / 控制器）和任务名清单从 MAS 拉，按托管项缓存一次。
function loadMaaendOptions() {
  const info = currentScriptInfo();
  const scriptId = activeScriptId();
  if (!info || String(info.type || "") !== "MaaEndConfig" || !scriptId) return;
  if (state.maaendScript === scriptId) return;
  state.maaendScript = scriptId;
  state.maaendOptions = null;
  state.maaendTasks = null;
  const refresh = function () {
    if (activeScriptId() !== scriptId) return;
    if (scriptDrawerOpen()) renderScriptForm();
    else renderTaskForm();
  };
  callApi("maaend/tasks", { scriptId: scriptId })
    .then(function (data) {
      state.maaendTasks = Array.isArray(data && data.tasks) ? data.tasks : [];
      refresh();
    })
    .catch(function () {
      state.maaendTasks = [];
    });
  callApi("maaend/options", { scriptId: scriptId })
    .then(function (data) {
      const options = (data && data.options) || {};
      state.maaendOptions = Object.keys(options).length ? options : null;
      refresh();
    })
    .catch(function () {
      state.maaendOptions = null;
    });
}

// ---- 一条龙编排（BetterGI 的 Groups / ZZZ-OD 的 AppList）----
// BetterGI 把要做的事放在 OneDragon.Groups（中文组名数组，顺序即执行顺序），
// ZZZ-OD 放在 OneDragon.AppList（JSON 字符串 [{app_id, enabled}]，顺序即执行顺序）。
// 这两块都不是普通标量字段，所以单独渲染成可勾选/可排序的列表。

function oneDragonBag() {
  const data = state.editing && state.editing.data;
  const bag = data && data.OneDragon;
  return bag && typeof bag === "object" ? bag : null;
}

function parseLooseList(raw) {
  if (Array.isArray(raw)) return raw.slice();
  if (typeof raw !== "string") return [];
  const text = raw.trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function moveListItem(list, index, delta) {
  const from = Number(index);
  const to = from + delta;
  if (!Number.isFinite(from) || from < 0 || from >= list.length) return list.slice();
  if (to < 0 || to >= list.length) return list.slice();
  const copy = list.slice();
  const item = copy.splice(from, 1)[0];
  copy.splice(to, 0, item);
  return copy;
}

function writeOneDragon(key, value) {
  if (typeof setConfigPath === "function") setConfigPath("OneDragon." + key, value);
  renderTaskForm();
}

function bettergiGroupNames() {
  const names = [];
  const push = function (name) {
    const text = String(name == null ? "" : name).trim();
    if (text && names.indexOf(text) < 0) names.push(text);
  };
  BETTERGI_BUILTIN_GROUPS.forEach(push);
  (state.bgiCustomGroups || []).forEach(function (item) {
    push(item && item.name);
  });
  const bag = oneDragonBag();
  if (bag) parseLooseList(bag.Groups).forEach(push);
  return names;
}

// ---- BetterGI 一条龙的执行顺序（OneDragon.Queue 驱动）----
// BetterGI 只有 8 个内置组和若干自定义组；真正决定「先跑什么」的是 MAS 的队列
// （OneDragon.Queue），Group 顺序只是开关表。这里读 Queue、改顺序后再写回 Queue。
const BGI_KIND_LABELS = {
  builtin: "内置组",
  js: "JS",
  pathing: "地图追踪",
  scriptgroup: "配置组",
  keymouse: "录制",
  custom: "自定义",
};

const BGI_SOURCE_TEXT = {
  queue: "顺序来自 AUTO-MAS 的可视化队列，下面就是实际执行顺序。",
  config: "顺序来自 BetterGI 配置里的 TaskOrder（下面就是实际顺序）。改完点保存会写成 MAS 的可视化队列。",
  groups: "这个账号还没排过队，先按 Groups 开关表的顺序显示，实际顺序可能和 BetterGI 配置不同。",
};

function bgiStamp(scriptId, userId) {
  return String(scriptId || "") + "|" + String(userId || "") + "|" + String((state.editing && state.editing.scriptId) || "");
}

function bgiCandidateList(kind) {
  const cands = (state.bgiCandidates || {})[kind];
  return Array.isArray(cands) ? cands : [];
}

function bgiItems() {
  const order = state.bgiOrder;
  return order && Array.isArray(order.items) ? order.items : [];
}

function bgiItemIndex(name) {
  const items = bgiItems();
  for (let index = 0; index < items.length; index += 1) {
    if (items[index] && items[index].name === name) return index;
  }
  return -1;
}

function bgiKindTag(kind) {
  return BGI_KIND_LABELS[kind] || "自定义";
}

function bettergiQueueRows() {
  const items = bgiItems();
  if (!items.length) {
    return '<p class="hint">一条龙是空的，加几项进来它才会干活。</p>';
  }
  return items
    .map(function (item, index) {
      const name = String((item && item.name) || "");
      const kind = String((item && item.kind) || "custom");
      return [
        '<div class="ord-row bgiq-row">',
        '<span class="ord-index">' + (index + 1) + "</span>",
        '<span class="ord-name">' + escapeHtml(name) + "</span>",
        '<span class="bgiq-kind">' + escapeHtml(bgiKindTag(kind)) + "</span>",
        '<label class="check-inline"><input type="checkbox" data-od="1" data-bgiq-check="' + index + '"' +
          (item.enabled === false ? "" : " checked") + ' /><span>跑</span></label>',
        '<span class="ord-actions">',
        '<button class="mini-button" type="button" data-od="1" data-bgiq-up="' + index + '" title="上移">↑</button>',
        '<button class="mini-button" type="button" data-od="1" data-bgiq-down="' + index + '" title="下移">↓</button>',
        '<button class="mini-button is-danger" type="button" data-od="1" data-bgiq-del="' + index + '">移除</button>',
        "</span></div>",
      ].join("");
    })
    .join("");
}

function bgiCandidateChips(kind, label, candidates) {
  const items = bgiItems();
  const picked = {};
  items.forEach(function (item) {
    if (item && item.name) picked[String(item.name)] = true;
  });
  const rest = (candidates || []).filter(function (item) {
    const name = String((item && (item.value || item.name)) || "").trim();
    return name && !picked[name];
  });
  if (!rest.length) return "";
  return (
    '<p class="hint">加一项' + escapeHtml(label) + "：</p>" +
    '<div class="chip-row">' +
    rest
      .map(function (item) {
        const name = String(item.value || item.name || "").trim();
        const text = String(item.label || name);
        return (
          '<button class="chip-add" type="button" data-od="1" data-bgiq-add="' +
          escapeHtml(kind + "|" + name) +
          '">+ ' +
          escapeHtml(text) +
          "</button>"
        );
      })
      .join("") +
    "</div>"
  );
}

function bettergiQueueCandidatesHtml() {
  const builtinLeft = BETTERGI_BUILTIN_GROUPS.filter(function (name) {
    return bgiItemIndex(name) < 0;
  }).map(function (name) {
    return { value: name, label: name };
  });
  const custom = ((state.bgiCustomGroups || []).map(function (item) {
    return { value: String((item && item.name) || ""), label: String((item && item.label) || (item && item.name) || "") };
  })).filter(function (item) {
    return item.value;
  });
  const parts = [
    bgiCandidateChips("builtin", "内置组", builtinLeft),
    bgiCandidateChips("scriptgroup", "配置组", custom),
    bgiCandidateChips("js", "JS 脚本", bgiCandidateList("js")),
    bgiCandidateChips("pathing", "地图追踪", bgiCandidateList("pathing")),
    bgiCandidateChips("keymouse", "键鼠录制", bgiCandidateList("keymouse")),
  ].filter(Boolean);
  return parts.join("");
}

function bettergiQueueHtml() {
  const order = state.bgiOrder;
  if (!order) {
    if (state.bgiOrderError) {
      return (
        '<div class="ord-block"><p class="hint">一条龙排程没读到：' +
        escapeHtml(state.bgiOrderError) +
        '</p><div class="ord-actions"><button class="mini-button" type="button" data-od="1" data-bgiq-retry="1">重试</button></div></div>'
      );
    }
    return '<div class="ord-block"><p class="hint">正在读一条龙的排程…</p></div>';
  }
  const source = String(order.source || "groups");
  const tip = BGI_SOURCE_TEXT[source] || BGI_SOURCE_TEXT.groups;
  const dirty = state.bgiOrderDirty ? " · 未保存" : "";
  return [
    '<div class="ord-block bgiq-block">',
    '<div class="ord-head"><span>一条龙执行顺序' + escapeHtml(dirty) + "</span>",
    '<span class="ord-actions">',
    '<button class="mini-button" type="button" data-od="1" data-bgiq-default="1">套用默认 8 组</button>',
    '<button class="mini-button" type="button" data-od="1" data-bgiq-clear="1">清空</button>',
    '<button class="mini-button is-primary" type="button" data-od="1" data-bgiq-save="1">保存顺序</button>',
    "</span></div>",
    '<p class="hint">' + escapeHtml(tip) + (order.configPath ? " 配置文件：" + escapeHtml(String(order.configPath)) : "") + "</p>",
    bettergiQueueRows(),
    bettergiQueueCandidatesHtml(),
    "</div>",
  ].join("");
}

function bgiSetItems(items) {
  const order = state.bgiOrder || { source: "queue", items: [], configPath: "" };
  order.items = items;
  state.bgiOrder = order;
  state.bgiOrderDirty = true;
  refreshBettergiOrder();
}

function refreshBettergiOrder() {
  if (typeof scriptDrawerOpen === "function" && scriptDrawerOpen()) renderScriptForm();
  else renderTaskForm();
}

function loadBettergiOrder(scriptId, userId, force) {
  const stamp = String(scriptId || "") + "|" + String(userId || "");
  if (!force && state.bgiOrderStamp === stamp) return;
  state.bgiOrderStamp = stamp;
  state.bgiOrder = null;
  state.bgiOrderDirty = false;
  state.bgiOrderError = "";
  state.bgiCandidates = null;
  const configName = String((state.editing && state.editing.configName) || "");
  callApi("bettergi/order", { scriptId: scriptId, userId: userId || "", configName: configName })
    .then(function (data) {
      if (activeScriptId() !== scriptId) return;
      const order = (data && data.order) || null;
      state.bgiOrder = order && Array.isArray(order.items) ? order : null;
      state.bgiCandidates = (data && data.candidates) || {};
      state.bgiCustomGroups = Array.isArray(data && data.custom) ? data.custom : state.bgiCustomGroups;
      state.bgiOrderDirty = false;
      state.bgiOrderError = state.bgiOrder ? "" : "AUTO-MAS 没返回排程数据。";
      refreshBettergiOrder();
    })
    .catch(function (error) {
      state.bgiOrder = null;
      state.bgiOrderError = error.message || "请求失败";
      refreshBettergiOrder();
      showToast(error.message, true);
    });
}

async function saveBettergiOrder(button) {
  const scriptId = activeScriptId();
  const items = bgiItems();
  if (!scriptId) return;
  if (!items.length) {
    showToast("一条龙是空的，没东西可保存。", true);
    return;
  }
  if (button) button.disabled = true;
  try {
    await postApi("bettergi/order/save", {
      scriptId: scriptId,
      userId: (state.editing && state.editing.userId) || "",
      items: items.map(function (item) {
        return { kind: item.kind, name: item.name, enabled: item.enabled !== false };
      }),
    });
    showToast("一条龙顺序已保存");
    state.bgiOrderDirty = false;
    loadBettergiOrder(scriptId, (state.editing && state.editing.userId) || "", true);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    if (button) button.disabled = false;
  }
}

function handleBettergiQueueClick(node) {
  const attr = function (name) {
    return node.getAttribute(name);
  };
  const has = function (name) {
    return node.hasAttribute(name);
  };
  if (has("data-bgiq-check")) {
    const index = Number(attr("data-bgiq-check"));
    const items = bgiItems().slice();
    if (!items[index]) return true;
    items[index] = Object.assign({}, items[index], { enabled: node.checked !== false });
    bgiSetItems(items);
    return true;
  }
  if (has("data-bgiq-add")) {
    const raw = String(attr("data-bgiq-add") || "");
    const parts = raw.split("|");
    const kind = parts[0] || "custom";
    const name = parts.slice(1).join("|");
    if (!name) return true;
    const items = bgiItems().slice();
    if (bgiItemIndex(name) < 0) items.push({ kind: kind, name: name, enabled: true });
    bgiSetItems(items);
    return true;
  }
  if (has("data-bgiq-del")) {
    const items = bgiItems().slice();
    items.splice(Number(attr("data-bgiq-del")), 1);
    bgiSetItems(items);
    return true;
  }
  if (has("data-bgiq-up") || has("data-bgiq-down")) {
    const up = has("data-bgiq-up");
    const key = up ? "data-bgiq-up" : "data-bgiq-down";
    bgiSetItems(moveListItem(bgiItems(), Number(attr(key)), up ? -1 : 1));
    return true;
  }
  if (has("data-bgiq-default")) {
    bgiSetItems(
      BETTERGI_BUILTIN_GROUPS.map(function (name) {
        return { kind: "builtin", name: name, enabled: true };
      }),
    );
    return true;
  }
  if (has("data-bgiq-clear")) {
    bgiSetItems([]);
    return true;
  }
  if (has("data-bgiq-retry")) {
    loadBettergiOrder(activeScriptId(), (state.editing && state.editing.userId) || "", true);
    return true;
  }
  if (has("data-bgiq-save")) {
    saveBettergiOrder(node);
    return true;
  }
  return false;
}

function bettergiCustomGroupList() {
  const bag = oneDragonBag() || {};
  return parseLooseList(bag.CustomGroups)
    .map(function (item) {
      if (!item || typeof item !== "object") return null;
      return { name: String(item.name || ""), enabled: item.enabled !== false };
    })
    .filter(Boolean);
}

function bettergiCustomGroupsHtml() {
  const list = bettergiCustomGroupList();
  const rows = list
    .map(function (item, index) {
      return (
        '<div class="ord-row">' +
        '<input class="task-input ord-input" type="text" data-bgi-cg-name="' +
        index +
        '" value="' +
        escapeHtml(item.name) +
        '" />' +
        '<label class="check-inline"><input type="checkbox" data-bgi-cg-enabled="' +
        index +
        '"' +
        (item.enabled ? " checked" : "") +
        ' /><span>启用</span></label>' +
        '<button class="mini-button is-danger" type="button" data-od="1" data-bgi-cg-del="' +
        index +
        '">删除</button>' +
        "</div>"
      );
    })
    .join("");
  const known = (state.bgiCustomGroups || [])
    .map(function (item) {
      return String((item && item.name) || "");
    })
    .filter(function (name) {
      return name && !list.some(function (entry) {
        return entry.name === name;
      });
    });
  const knownHtml = known.length
    ? '<p class="hint">BetterGI 配置里还有这些组（点一下补进来）：</p><div class="chip-row">' +
      known
        .map(function (name) {
          return (
            '<button class="chip-add" type="button" data-od="1" data-bgi-cg-addname="' +
            escapeHtml(name) +
            '">+ ' +
            escapeHtml(name) +
            "</button>"
          );
        })
        .join("") +
      "</div>"
    : "";
  return [
    '<div class="ord-head"><span>自定义配置组（写进一条龙的自定义组）</span>',
    '<button class="mini-button" type="button" data-od="1" data-bgi-cg-add="1">+ 加一组</button></div>',
    rows || '<p class="hint">没有自定义配置组。这个列表由插件直接写进配置，名字要和 BetterGI 里的组名一致。</p>',
    knownHtml,
  ].join("");
}

function zzzCatalogMap() {
  const map = {};
  (state.zzzCatalog || []).forEach(function (item) {
    if (item && item.appId) map[String(item.appId)] = item;
  });
  return map;
}

function zzzAppListHtml() {
  const bag = oneDragonBag() || {};
  const map = zzzCatalogMap();
  const list = parseLooseList(bag.AppList)
    .map(function (item) {
      if (!item || typeof item !== "object") return null;
      const appId = String(item.app_id || "");
      if (!appId) return null;
      return { appId: appId, enabled: item.enabled !== false };
    })
    .filter(Boolean);
  const rows = list
    .map(function (item, index) {
      const meta = map[item.appId];
      const label = meta ? meta.name : item.appId;
      const tag = meta && meta.configurable ? '<span class="ord-tag">可调参数</span>' : "";
      return (
        '<div class="ord-row' +
        (item.enabled ? "" : " is-off") +
        '"><label class="check-inline"><input type="checkbox" data-zzz-enabled="' +
        index +
        '"' +
        (item.enabled ? " checked" : "") +
        ' /><span class="ord-name">' +
        escapeHtml(label) +
        "</span></label>" +
        tag +
        '<span class="ord-actions">' +
        '<button class="mini-button" type="button" data-od="1" data-zzz-up="' +
        index +
        '" title="上移">↑</button>' +
        '<button class="mini-button" type="button" data-od="1" data-zzz-down="' +
        index +
        '" title="下移">↓</button>' +
        '<button class="mini-button is-danger" type="button" data-od="1" data-zzz-del="' +
        index +
        '">移除</button>' +
        "</span></div>"
      );
    })
    .join("");
  const joined = list.map(function (item) {
    return item.appId;
  });
  const rest = (state.zzzCatalog || []).filter(function (item) {
    return item && item.appId && joined.indexOf(String(item.appId)) < 0;
  });
  const restHtml = rest.length
    ? '<p class="hint">还没加入编排的任务（点一下加到最后）：</p><div class="chip-row">' +
      rest
        .map(function (item) {
          return (
            '<button class="chip-add" type="button" data-od="1" data-zzz-add="' +
            escapeHtml(String(item.appId)) +
            '">+ ' +
            escapeHtml(String(item.name || item.appId)) +
            "</button>"
          );
        })
        .join("") +
      "</div>"
    : "";
  return [
    '<div class="ord-head"><span>一条龙任务编排（从上到下依次跑）</span><span class="ord-actions">',
    '<button class="mini-button" type="button" data-od="1" data-zzz-default="1">套用默认一条龙</button>',
    '<button class="mini-button" type="button" data-od="1" data-zzz-clear="1">清空</button>',
    "</span></div>",
    rows || '<p class="hint">一条龙里一个任务都没有，启动后不会做任何事。</p>',
    restHtml,
    '<label class="task-field"><span>跑完游戏后</span><select class="task-input" data-conf-path="OneDragon.AfterDone">' +
      selectOptions(ZZZOD_AFTER_DONE_OPTIONS, String(bag.AfterDone || "关闭游戏")) +
      "</select></label>",
  ].join("");
}

// ---- 绝区零预备编队（zzz-od 的 team.yml，固定 20 个） ----
// 一条龙跑图时用「游戏内编队」名对队伍；这里改的是名称和绑定的配队方案，
// 成员（三个代理人）由一条龙自己在游戏里识别，插件只读不写。
function zzzAgentName(agentId) {
  const id = String(agentId || "");
  if (!id || id === "unknown") return "未识别";
  const list = state.zzzAgents || [];
  for (let i = 0; i < list.length; i += 1) {
    if (String(list[i].value) === id) return String(list[i].label || id);
  }
  return id;
}

function zzzTeamRowsHtml() {
  const teams = state.zzzTeams || [];
  if (!teams.length) return '<p class="hint">正在读预备编队…</p>';
  const options = (state.zzzAutoBattle || []).map(function (item) {
    return [item.value, item.label];
  });
  return teams
    .map(function (team, index) {
      const agents = (team.agents || []).map(zzzAgentName).join(" / ");
      return [
        '<div class="zzz-team-row">',
        '<span class="zzz-team-idx">' + escapeHtml(String(index + 1)) + "</span>",
        '<input class="task-input" type="text" data-zzz-team-name="' + index + '" value="' + escapeHtml(String(team.name || "")) + '" />',
        '<select class="task-input" data-zzz-team-ab="' + index + '">',
        selectOptions(options, String(team.autoBattle || "")),
        "</select>",
        '<span class="zzz-team-agents" title="成员由一条龙在游戏里识别">' + escapeHtml(agents || "无成员") + "</span>",
        "</div>",
      ].join("");
    })
    .join("");
}

function renderZzzTeamsBlock() {
  const teams = state.zzzTeams || [];
  const meta = teams.length ? teams.length + " 个编队" : "读取中";
  return [
    '<details class="task-section zzz-team-section">',
    "<summary><span class=\"fold-title\">预备编队（游戏内配队）</span><span class=\"fold-meta\">",
    escapeHtml(meta),
    "</span></summary>",
    '<p class="hint">一条龙按「游戏内编队」名字认队伍：改名称要和游戏里的编队名一致，右边的配队方案是自动战斗用哪套。成员由一条龙在游戏里识别，插件只读。</p>',
    '<div class="zzz-team-rows">',
    zzzTeamRowsHtml(),
    "</div>",
    '<div class="native-actions"><button class="mini-button" type="button" id="zzz-team-save">保存编队</button><span class="hint" id="zzz-team-state"></span></div>',
    "</details>",
  ].join("");
}

function loadZzzTeams(scriptId, userId) {
  const key = String(scriptId) + "|" + String(userId);
  if (state.zzzTeamKey === key) return;
  state.zzzTeamKey = key;
  state.zzzTeams = null;
  state.zzzAutoBattle = [];
  state.zzzAgents = [];
  if (!scriptId || !userId) return;
  callApi("zzzod/teams", { scriptId: scriptId, userId: userId })
    .then(function (data) {
      if (state.zzzTeamKey !== key) return;
      state.zzzTeams = Array.isArray(data && data.teams) ? data.teams : [];
      state.zzzAutoBattle = Array.isArray(data && data.autoBattle) ? data.autoBattle : [];
      state.zzzAgents = Array.isArray(data && data.agents) ? data.agents : [];
      if (state.activeTab === "task") renderTaskForm();
    })
    .catch(function (err) {
      if (state.zzzTeamKey !== key) return;
      state.zzzTeams = [];
      if (state.activeTab === "task") renderTaskForm();
      showToast("预备编队读取失败：" + String((err && err.message) || err), true);
    });
}

function commitZzzTeamValue(target) {
  const teams = state.zzzTeams || [];
  const nameIdx = target.getAttribute("data-zzz-team-name");
  const abIdx = target.getAttribute("data-zzz-team-ab");
  const raw = nameIdx !== null ? nameIdx : abIdx;
  if (raw === null) return;
  const index = Number(raw);
  if (!teams[index]) return;
  if (nameIdx !== null) teams[index].name = String(target.value || "").trim();
  else teams[index].autoBattle = String(target.value || "");
}

function saveZzzTeams() {
  const teams = state.zzzTeams || [];
  if (!teams.length) {
    showToast("预备编队还没读出来。", true);
    return;
  }
  const payload = teams.map(function (team) {
    return {
      name: String(team.name || ""),
      autoBattle: String(team.autoBattle || ""),
      agent_id_list: (team.agents || []).slice(),
    };
  });
  const stateNode = document.getElementById("zzz-team-state");
  if (stateNode) stateNode.textContent = "正在保存…";
  postApi("zzzod/teams/save", {
    scriptId: (state.editing && state.editing.scriptId) || "",
    userId: (state.editing && state.editing.userId) || "",
    teams: payload,
  })
    .then(function (data) {
      const saved = Array.isArray(data && data.saved) ? data.saved : [];
      if (saved.length) {
        state.zzzTeams = saved.map(function (item) {
          return {
            idx: Number(item.idx || 0),
            name: String(item.name || ""),
            autoBattle: String(item.autoBattle || ""),
            agents: Array.isArray(item.agents) ? item.agents : [],
          };
        });
      }
      if (stateNode) stateNode.textContent = "";
      showToast("编队已保存");
      if (state.activeTab === "task") renderTaskForm();
    })
    .catch(function (err) {
      if (stateNode) stateNode.textContent = "";
      showToast("保存编队失败：" + String((err && err.message) || err), true);
    });
}

// ---- MaaEnd 理管任务（基质刷取 / 协议空间）与库存目标 ----
// 执行策略是账号配置 Info.SanityStrategy（MAS / Native / Inventory），
// 只有 Inventory 才会把 Task.SupplyPlanLimits 当库存计划交给 MaaEnd 去规划协议空间。
const MAAEND_SANITY_STRATEGIES = [
  {
    value: "MAS",
    label: "指定任务 / 计划表",
    hint: "按下面「关卡」「任务开关」里的配置刷理智，库存目标不参与。",
  },
  {
    value: "Native",
    label: "沿用原生配置",
    hint: "用 MaaEnd 自己配置里的理管设置，本页的关卡与库存目标都不生效。",
  },
  {
    value: "Inventory",
    label: "库存目标",
    hint: "本轮按库存计划执行协议空间，固定关卡与周计划不应用。",
  },
];

const MAAEND_SUPPLY_CATEGORIES = [
  { key: "all", label: "全部" },
  { key: "exp", label: "经验" },
  { key: "break", label: "突破" },
  { key: "skill", label: "技能" },
  { key: "currency", label: "货币" },
];

// 分类没有由上游下发（inventory.inputs 只有 label 和 value），按材料 ID 后缀自己归档。
const MAAEND_SUPPLY_CATEGORY_OF = {
  T_CREDS: "currency",
  PROTOHEDRON: "break",
  PROTOPRISM: "break",
  PROTOSET: "break",
  PROTODISK: "break",
  COGNITIVE_CARRIER_EXP: "exp",
  COMBAT_RECORD_EXP: "exp",
  WEAPON_EXP: "exp",
  HEAVY_CAST_DIE: "skill",
  CAST_DIE: "skill",
  WARP_PLASMA_COATED_SLIDE: "skill",
  TRIPHASIC_NANOFLAKE: "skill",
  QUADRANT_FITTING_FLUID: "skill",
  TACHYON_SCREENING_LATTICE: "skill",
  D96_STEEL_SAMPLE_4: "skill",
  METADIASTIMA_PHOTOEMISSION_TUBE: "skill",
};

function supplyCategoryOf(key) {
  const short = String(key || "").replace(/^SupplyPlanLimit_/, "");
  return MAAEND_SUPPLY_CATEGORY_OF[short] || "skill";
}

// 材料清单优先用 AUTO-MAS 下发的 inventory.inputs（上游加了新道具这里会自动多一行），
// 拿不到就退回本地那张 16 项表。
function inventoryInputs() {
  const options = state.maaendOptions || {};
  const inventory = options.inventory || {};
  const inputs = Array.isArray(inventory.inputs) ? inventory.inputs : [];
  const list = [];
  inputs.forEach(function (item) {
    if (!item || !item.value) return;
    list.push({ key: String(item.value), label: String(item.label || item.value) });
  });
  if (list.length) return list;
  return MAAEND_SUPPLY_ITEMS.map(function (item) {
    return { key: item.key, label: item.label };
  });
}

function supplySearchText() {
  return String(state.supplySearch || "").trim().toLowerCase();
}

function supplyValues() {
  return supplyPlanMap().map || {};
}

function supplyEntries() {
  const map = supplyValues();
  return inventoryInputs().map(function (item) {
    const raw = map[item.key];
    const value = raw === undefined || raw === null ? "" : String(raw);
    return {
      key: item.key,
      label: item.label,
      cat: supplyCategoryOf(item.key),
      value: value,
      filled: value.trim() !== "",
    };
  });
}

function supplyVisibleEntries() {
  const keyword = supplySearchText();
  const cat = String(state.supplyCat || "all");
  const onlySet = Boolean(state.supplyOnlySet);
  return supplyEntries().filter(function (item) {
    if (cat !== "all" && item.cat !== cat) return false;
    if (onlySet && !item.filled) return false;
    if (keyword) {
      const hay = (item.label + " " + item.key).toLowerCase();
      if (hay.indexOf(keyword) < 0) return false;
    }
    return true;
  });
}

function supplyRowsInner() {
  const list = supplyVisibleEntries();
  if (!list.length) {
    return '<p class="hint">没有匹配的材料，换个关键词或者点「全部」。</p>';
  }
  return (
    '<div class="supply-grid">' +
    list
      .map(function (item) {
        return supplyRowHtml(item.key, item.label, item.value);
      })
      .join("") +
    "</div>"
  );
}

function supplyCountText() {
  const all = supplyEntries();
  const filled = all.filter(function (item) { return item.filled; }).length;
  return "维护 " + all.length + " 项养成材料目标（已设置 " + filled + " 项）";
}

function supplyTabsInner() {
  const entries = supplyEntries();
  const cat = String(state.supplyCat || "all");
  return MAAEND_SUPPLY_CATEGORIES.map(function (item) {
    let count = entries.length;
    if (item.key !== "all") {
      count = entries.filter(function (entry) { return entry.cat === item.key; }).length;
    }
    return (
      '<button class="supply-tab' + (item.key === cat ? " is-active" : "") + '" type="button" data-supply-cat="' +
      escapeHtml(item.key) + '">' + escapeHtml(item.label) +
      ' <span class="supply-tab-count">' + count + "</span></button>"
    );
  }).join("");
}

function renderSupplyPanel() {
  return [
    '<div class="supply-panel" id="supply-panel">',
    '<div class="supply-toolbar">',
    '<input class="task-input" type="search" id="supply-search" placeholder="搜索材料" value="' +
      escapeHtml(state.supplySearch || "") + '" />',
    '<label class="check-line"><input type="checkbox" id="supply-only-set"' +
      (state.supplyOnlySet ? " checked" : "") + " /><span>仅显示已设置目标</span></label>",
    "</div>",
    '<div class="supply-meta"><span id="supply-count">' + escapeHtml(supplyCountText()) + "</span>",
    '<span class="hint">目标须为 0-3000000000 的整数，不带前导零；0 表示不参与计划。</span></div>',
    '<div class="supply-tabs" id="supply-tabs">' + supplyTabsInner() + "</div>",
    '<div class="supply-rows" id="supply-rows">' + supplyRowsInner() + "</div>",
    "</div>",
  ].join("");
}

// 改搜索词 / 切分类只重写列表区，不动输入框本身，免得每敲一个字就丢焦点。
function refreshSupplyPanel() {
  if (!elements.taskForm) return;
  const rows = elements.taskForm.querySelector("#supply-rows");
  if (rows) rows.innerHTML = supplyRowsInner();
  const count = elements.taskForm.querySelector("#supply-count");
  if (count) count.textContent = supplyCountText();
  const tabs = elements.taskForm.querySelector("#supply-tabs");
  if (tabs) tabs.innerHTML = supplyTabsInner();
}

function maaendInventoryOption() {
  const options = state.maaendOptions || {};
  return options.inventory || null;
}

function renderMaaendSanitySection(data) {
  const info = (data && data.Info) || {};
  const task = (data && data.Task) || {};
  if (!Object.prototype.hasOwnProperty.call(task, "IfSanity") && !Object.prototype.hasOwnProperty.call(task, "SupplyPlanLimits")) {
    return "";
  }
  const strategy = String(info.SanityStrategy || "MAS");
  const current =
    MAAEND_SANITY_STRATEGIES.filter(function (item) { return item.value === strategy; })[0] ||
    MAAEND_SANITY_STRATEGIES[0];
  const inventory = maaendInventoryOption();
  const description =
    (inventory && inventory.description) ||
    "为各培养道具设定目标。经验类按折算经验填写，其余按件数；全部达标后本轮结束。";
  const claimModes = (inventory && Array.isArray(inventory.claimModes) && inventory.claimModes.length
    ? inventory.claimModes
    : MAAEND_PROTOCOL_CLAIM_OPTIONS
  ).map(function (item) {
    return { value: String(item.value), label: String(item.label || item.value) };
  });
  const claimValue = String(task.ProtocolSpaceObtainModeClaim || "ObtainScaling2");
  const modes = MAAEND_SANITY_STRATEGIES.map(function (item) {
    return (
      '<button class="sanity-mode' + (item.value === strategy ? " is-active" : "") +
      '" type="button" data-sanity-strategy="' + escapeHtml(item.value) + '" title="' +
      escapeHtml(item.hint) + '">' + escapeHtml(item.label) + "</button>"
    );
  }).join("");
  return [
    '<section class="task-group sanity-group"><h3>理管任务（基质刷取 / 协议空间）</h3>',
    '<div class="task-grid">',
    '<label class="toggle-item"><input type="checkbox" data-conf-path="Task.IfSanity"' +
      (task.IfSanity === false ? "" : " checked") + " /><span>启用理管任务</span></label>",
    '<label class="toggle-item"><input type="checkbox" data-conf-path="Task.IfAutoUseSpMedication"' +
      (task.IfAutoUseSpMedication === false ? "" : " checked") + " /><span>需要时自动用理智药</span></label>",
    "</div>",
    '<div class="sanity-strategy"><span class="sanity-strategy-label">执行策略</span>',
    '<div class="sanity-modes">' + modes + "</div>",
    '<p class="hint">' + escapeHtml(current.hint) + "</p></div>",
    strategy === "Inventory"
      ? ""
      : '<p class="hint sanity-warn">当前执行策略不是「库存目标」，下面的材料目标值本轮不会用上；点到「库存目标」才生效。</p>',
    '<div class="supply-block"><p class="hint">' + escapeHtml(description) + "</p>",
    renderSupplyPanel(),
    '<label class="task-field"><span>库存任务领取方式</span><select class="task-input" data-conf-path="Task.ProtocolSpaceObtainModeClaim">' +
      selectOptions(
        claimModes.map(function (item) { return [item.value, item.label]; }),
        claimValue
      ) + "</select></label>",
    "</div></section>",
  ].join("");
}

function setSanityStrategy(value) {
  if (!setConfigPath("Info.SanityStrategy", String(value || ""))) return;
  renderTaskForm();
}

function handleSupplyChange(target) {
  if (target.id === "supply-only-set") {
    state.supplyOnlySet = Boolean(target.checked);
    refreshSupplyPanel();
    return true;
  }
  return false;
}

function handleSupplyInput(target) {
  if (target.id !== "supply-search") return false;
  state.supplySearch = String(target.value || "");
  refreshSupplyPanel();
  return true;
}

function handleSupplyClick(node) {
  if (node.hasAttribute("data-sanity-strategy")) {
    setSanityStrategy(node.getAttribute("data-sanity-strategy"));
    return true;
  }
  if (node.hasAttribute("data-supply-cat")) {
    state.supplyCat = String(node.getAttribute("data-supply-cat") || "all");
    refreshSupplyPanel();
    return true;
  }
  return false;
}

function configCustomHtml(full) {
  const info = currentScriptInfo();
  const type = String((info && info.type) || "");
  if (type === "BetterGIConfig") {
    if (full === "OneDragon.Groups") return bettergiQueueHtml();
    if (full === "OneDragon.CustomGroups") return '<div class="ord-block">' + bettergiCustomGroupsHtml() + "</div>";
  }
  if (type === "ZzzOdConfig" && full === "OneDragon.AppList") {
    return '<div class="ord-block">' + zzzAppListHtml() + "</div>";
  }
  return "";
}

function handleOneDragonClick(node) {
  const bag = oneDragonBag() || {};
  const attr = function (name) {
    return node.getAttribute(name);
  };
  const has = function (name) {
    return node.hasAttribute(name);
  };
  if (handleBettergiQueueClick(node)) return true;
  if (has("data-bgi-cg-add")) {
    const list = bettergiCustomGroupList();
    list.push({ name: "新配置组", enabled: true });
    writeOneDragon("CustomGroups", JSON.stringify(list));
    return true;
  }
  if (has("data-bgi-cg-addname")) {
    const name = attributeSafe(attr("data-bgi-cg-addname"));
    const list = bettergiCustomGroupList();
    if (name && !list.some(function (item) { return item.name === name; })) list.push({ name: name, enabled: true });
    writeOneDragon("CustomGroups", JSON.stringify(list));
    return true;
  }
  if (has("data-bgi-cg-del")) {
    const list = bettergiCustomGroupList();
    list.splice(Number(attr("data-bgi-cg-del")), 1);
    writeOneDragon("CustomGroups", JSON.stringify(list));
    return true;
  }
  if (has("data-zzz-add")) {
    const appId = attributeSafe(attr("data-zzz-add"));
    const list = parseLooseList(bag.AppList).map(function (item) {
      return item && typeof item === "object" ? { app_id: String(item.app_id || ""), enabled: item.enabled !== false } : null;
    }).filter(Boolean);
    if (appId && !list.some(function (item) { return item.app_id === appId; })) {
      list.push({ app_id: appId, enabled: true });
    }
    writeOneDragon("AppList", JSON.stringify(list));
    return true;
  }
  if (has("data-zzz-del") || has("data-zzz-up") || has("data-zzz-down")) {
    const list = parseLooseList(bag.AppList).map(function (item) {
      return item && typeof item === "object" ? { app_id: String(item.app_id || ""), enabled: item.enabled !== false } : null;
    }).filter(Boolean);
    if (has("data-zzz-del")) list.splice(Number(attr("data-zzz-del")), 1);
    else {
      const up = has("data-zzz-up");
      const moved = moveListItem(list, Number(attr(up ? "data-zzz-up" : "data-zzz-down")), up ? -1 : 1);
      list.length = 0;
      moved.forEach(function (item) { list.push(item); });
    }
    writeOneDragon("AppList", JSON.stringify(list));
    return true;
  }
  if (has("data-zzz-default")) {
    const list = (state.zzzCatalog || [])
      .filter(function (item) { return item && item.appId && item.defaultGroup; })
      .map(function (item) { return { app_id: String(item.appId), enabled: true }; });
    writeOneDragon("AppList", JSON.stringify(list));
    return true;
  }
  if (has("data-zzz-clear")) {
    writeOneDragon("AppList", "[]");
    return true;
  }
  return false;
}

function attributeSafe(value) {
  return String(value == null ? "" : value);
}

function handleOneDragonControl(target) {
  const meta = target.dataset || {};
  const bag = oneDragonBag() || {};
  if (meta.bgiCgName !== undefined) {
    const list = bettergiCustomGroupList();
    const index = Number(meta.bgiCgName);
    if (list[index]) {
      list[index].name = String(target.value || "");
      writeOneDragon("CustomGroups", JSON.stringify(list));
      return true;
    }
  }
  if (meta.bgiCgEnabled !== undefined) {
    const list = bettergiCustomGroupList();
    const index = Number(meta.bgiCgEnabled);
    if (list[index]) {
      list[index].enabled = Boolean(target.checked);
      writeOneDragon("CustomGroups", JSON.stringify(list));
      return true;
    }
  }
  if (meta.zzzEnabled !== undefined) {
    const list = parseLooseList(bag.AppList).map(function (item) {
      return item && typeof item === "object" ? { app_id: String(item.app_id || ""), enabled: item.enabled !== false } : null;
    }).filter(Boolean);
    const index = Number(meta.zzzEnabled);
    if (list[index]) {
      list[index].enabled = Boolean(target.checked);
      writeOneDragon("AppList", JSON.stringify(list));
      return true;
    }
  }
  return false;
}

// 托管项类型专用的候选数据（BetterGI 一条龙配置名 / 自定义组，绝区零任务目录）
function loadTypeOptions() {
  const info = currentScriptInfo();
  const scriptId = activeScriptId();
  if (!info || !scriptId) return;
  const type = String(info.type || "");
  const refresh = function () {
    if (activeScriptId() !== scriptId) return;
    if (scriptDrawerOpen()) renderScriptForm();
    else renderTaskForm();
  };
  if (type === "BetterGIConfig") {
    loadBettergiOrder(scriptId, (state.editing && state.editing.userId) || "");
    if (state.bgiScript === scriptId) return;
    state.bgiScript = scriptId;
    state.bgiConfigs = [];
    state.bgiCustomGroups = [];
    callApi("bettergi/configs", { scriptId: scriptId })
      .then(function (data) {
        state.bgiConfigs = Array.isArray(data && data.configs) ? data.configs : [];
        refresh();
      })
      .catch(function () {});
    const base = String(
      (state.editing && state.editing.data && state.editing.data.Info && state.editing.data.Info.Base) || "",
    );
    callApi("bettergi/customGroups", {
      scriptId: scriptId,
      userId: (state.editing && state.editing.userId) || "",
      useMasConfig: base === "independent" ? "1" : "0",
    })
      .then(function (data) {
        state.bgiCustomGroups = Array.isArray(data && data.groups) ? data.groups : [];
        refresh();
      })
      .catch(function () {});
    return;
  }
  if (type === "ZzzOdConfig") {
    loadZzzTeams(scriptId, (state.editing && state.editing.userId) || "");
    if (state.zzzScript === scriptId) return;
    state.zzzScript = scriptId;
    state.zzzCatalog = [];
    callApi("zzzod/catalog", { scriptId: scriptId })
      .then(function (data) {
        state.zzzCatalog = Array.isArray(data && data.catalog) ? data.catalog : [];
        refresh();
      })
      .catch(function () {});
  }
}

// 配置基线选「原生」时 AUTO-MAS 不下发任何任务，任务页也就没有能选的东西。
function taskBaseMode() {
  const info = (state.editing && state.editing.data && state.editing.data.Info) || {};
  return String(info.Base || "shared");
}

function applyTaskTabState() {
  const native = taskBaseMode() === "native";
  (elements.tabs || []).forEach(function (tab) {
    if (tab.dataset && tab.dataset.tab === "task") tab.classList.toggle("is-native", native);
  });
  return native;
}

function renderTaskForm() {
  const scope = taskFoldScopeKey();
  const sameScope = state.taskFoldScope === scope;
  const opened = sameScope ? collectOpenFolds() : [];
  if (!sameScope) state.taskFoldScope = scope;
  state.taskFoldOpen = opened;
  renderTaskFormInner();
  if (opened.length) restoreOpenFolds(opened);
}

function renderTaskFormInner() {
  loadMaaendOptions();
  loadMaafwDefinition();
  loadWhimboxCatalog();
  loadOknteConfigs();
  loadTypeOptions();
  const data = state.editing?.data || {};
  if (applyTaskTabState()) {
    elements.taskQuickHint.classList.add("is-hidden");
    const cur = currentScriptInfo();
    let nativeBlock = "";
    if (cur && String(cur.type || "") === "MaaEndConfig") {
      const sid = String((state.editing && state.editing.scriptId) || "");
      const uid = String((state.editing && state.editing.userId) || "");
      loadMaaendUser(sid, uid);
      nativeBlock = maaendNativeBlock("user");
    }
    elements.taskForm.innerHTML = nativeBlock;
    elements.taskEmptyHint.textContent = nativeBlock
      ? "这个账号的配置基线是「原生」：AUTO-MAS 只负责把脚本拉起来，MAS 这边没有任务可勾。" +
        "下面这块改的是 MaaEnd 自己安装目录里的任务参数，原生基线直接读这份。"
      : "这个账号的配置基线是「原生」：AUTO-MAS 只负责把脚本拉起来，做什么由脚本自己的配置决定，所以这边没有任务可勾。" +
        "想让 MAS 下发任务，先到「基础」页把配置基线改成「独立」或「共享」，并勾上「启用覆写常规配置」。";
    elements.taskEmptyHint.classList.remove("is-hidden");
    return;
  }
  const plans = (state.editing?.plans || []).filter((plan) => plan.type === "MaaPlanConfig");
  const current = currentScriptInfo();
  const isMaaTask = !current || MAA_TASK_SCRIPT_TYPES.has(String(current.type || ""));
  if (current && String(current.type || "") === "OkNteConfig") {
    elements.taskQuickHint.classList.toggle("is-hidden", data.Info && data.Info.IfQuickConfig !== false);
    elements.taskEmptyHint.classList.add("is-hidden");
    elements.taskForm.innerHTML = renderOknteTaskForm(data);
    return;
  }
  if (current && String(current.type || "") === "WhimboxConfig") {
    elements.taskQuickHint.classList.toggle("is-hidden", data.Info && data.Info.IfQuickConfig !== false);
    elements.taskEmptyHint.classList.add("is-hidden");
    elements.taskForm.innerHTML = renderWhimboxTaskForm(data);
    return;
  }
  const hasStage = data.Stage && typeof data.Stage === "object";
  const hasTask = data.Task && typeof data.Task === "object";
  if (current && MAAFW_TASK_TYPES.has(String(current.type || ""))) {
    elements.taskQuickHint.classList.toggle("is-hidden", data.Info?.IfQuickConfig !== false);
    elements.taskEmptyHint.classList.add("is-hidden");
    elements.taskForm.innerHTML = renderMaafwTaskForm(data);
    return;
  }
  elements.taskQuickHint.classList.toggle("is-hidden", data.Info?.IfQuickConfig !== false);

  if (!isMaaTask || !hasStage || !hasTask) {
    if (!Object.keys(data).length) {
      elements.taskEmptyHint.textContent =
        "账号配置没取到（接口返回空的），任务参数没法渲染。看右下角有没有报错提示。";
    } else if (current && !isMaaTask) {
      const schemaHtml = renderSchemaTaskForm(String(current.type || ""), data);
      if (schemaHtml) {
        const intro =
          current.name +
          "（" +
          (current.typeLabel || current.type) +
          "）的任务参数：字段名和说明取自 AUTO-MAS 配置模型，开关直接勾、枚举走下拉、数字直接填；改哪项就提交哪项，不用自己写 JSON。";
        let nativeBlock = "";
        if (String(current.type || "") === "MaaEndConfig") {
          const sid = String((state.editing && state.editing.scriptId) || "");
          const uid = String((state.editing && state.editing.userId) || "");
          loadMaaendUser(sid, uid);
          nativeBlock = maaendNativeBlock("user");
        }
        elements.taskForm.innerHTML = ["<p class=\"hint\">", escapeHtml(intro), "</p>", nativeBlock, schemaHtml].join("");
        elements.taskEmptyHint.classList.add("is-hidden");
        return;
      }
      elements.taskEmptyHint.textContent =
        `${current.name}（${current.typeLabel || current.type}）在 AUTO-MAS 里没有可调的任务参数——` +
        "这类脚本（通用脚本、BAAH 等）只负责启动，参数在脚本自己的界面里配；这边能改的是账号名、启用状态和「托管」页的运行策略。";
    } else if (current) {
      elements.taskEmptyHint.textContent = `${current.name}（${current.type}）的账号配置里没有 MAA 式的 Stage / Task 段，参数请到「基础」页的完整配置 JSON 里改。`;
    } else {
      elements.taskEmptyHint.textContent =
        "这个托管在 AUTO-MAS 里没有 MAA 式的任务配置段，请到「基础」页的完整配置 JSON 里改。";
    }
    elements.taskForm.innerHTML = "";
    elements.taskEmptyHint.classList.remove("is-hidden");
    return;
  }
  elements.taskEmptyHint.classList.add("is-hidden");

  const sectionHtml = TASK_SECTIONS.map((section) => {
    if (section.type === "depot") return renderDepotSection(section);
    if (section.type === "eventDepot") return renderEventDepotSection(section);
    if (section.type === "cultivate") return renderCultivateSection(section);
    const bag = data[section.group];
    if (!bag || typeof bag !== "object") return "";
    if (section.type === "toggles") {
      const items = TASK_TOGGLES.map(([key, label]) => {
        const on = bag[key] !== false;
        return `<label class="toggle-item"><input type="checkbox" data-group="${section.group}" data-key="${key}"${on ? " checked" : ""} /><span>${escapeHtml(label)}</span></label>`;
      }).join("");
      return `<section class="task-group"><h3>${escapeHtml(section.title)}</h3><div class="toggle-grid">${items}</div></section>`;
    }
    const rows = section.fields
      .map((field) => {
        const control = taskControl(field, section.group, bag[field.key], plans);
        const wide = field.type === "json" || field.type === "readonly";
        return `<label class="task-field${wide ? " task-field-wide" : ""}"><span>${escapeHtml(field.label)}</span>${control}</label>`;
      })
      .join("");
    return `<section class="task-group"><h3>${escapeHtml(section.title)}</h3><div class="task-grid">${rows}</div></section>`;
  }).join("");
  elements.taskForm.innerHTML = foldSections(sectionHtml);
  ensureTaskLists();
}

// ---- 自定义基建排班表 ----

// AUTO-MAS 把 Data.CustomInfrast 标成隐藏字段（ui visibility=HIDE），账号配置读回来时
// 根本不带它；能拿到的是服务端解析好的 Task.InfrastName（标题 - 描述）。
function currentInfrastName() {
  const task = state.editing?.data?.Task || {};
  return { mode: String(task.InfrastMode || "Normal"), name: String(task.InfrastName || "").trim() };
}

function renderInfrastCurrent() {
  if (!elements.infrastCurrent) return;
  const block = elements.infrastCurrent.closest(".infrast-block");
  const task = state.editing?.data?.Task;
  const hasInfrast = Boolean(task) && typeof task === "object" && "InfrastMode" in task;
  if (block) block.classList.toggle("is-hidden", !hasInfrast);
  if (!hasInfrast) return;
  const info = currentInfrastName();
  if (info.mode !== "Custom") {
    elements.infrastCurrent.textContent =
      "基建模式是「" + info.mode + "」，不是自定义。导入排班表后要把上面的「基建模式」选成「自定义」才会用。";
    return;
  }
  if (!info.name) {
    elements.infrastCurrent.textContent =
      "还没导入自定义基建排班表，从下面挑一份导入就会显示标题和班次。";
    return;
  }
  elements.infrastCurrent.textContent = "当前：" + info.name;
}

function infrastSize(size) {
  const n = Number(size) || 0;
  return n > 1024 ? (n / 1024).toFixed(1) + " KB" : n + " B";
}

function renderInfrastList(scan) {
  if (!elements.infrastList) return;
  if (!scan) {
    elements.infrastList.innerHTML = "";
    return;
  }
  if (!scan.exists) {
    elements.infrastList.innerHTML =
      '<p class="hint">目录不存在：' + escapeHtml(scan.dir || "") + "（可以手填一个目录再扫一次）</p>";
    return;
  }
  const files = Array.isArray(scan.files) ? scan.files : [];
  if (!files.length) {
    elements.infrastList.innerHTML =
      '<p class="hint">' + escapeHtml(scan.dir || "") + " 下没有 .json 文件。</p>";
    return;
  }
  const rows = files
    .map(function (item) {
      const meta = [];
      if (item.title) meta.push("标题 " + item.title);
      if (item.description) meta.push(String(item.description));
      if (item.plans) meta.push(item.plans + " 班");
      meta.push(infrastSize(item.size));
      if (!item.valid && item.problem) meta.push(String(item.problem));
      const active = currentInfrastName();
      const fullLabel = item.title && item.description ? item.title + " - " + item.description : String(item.title || "");
      const inUse = !!active.name && (active.name === fullLabel || active.name === String(item.title || ""));
      if (inUse) meta.unshift("正在使用");
      const button = !item.valid
        ? '<button class="mini-button" type="button" disabled>不可用</button>'
        : inUse
          ? '<button class="mini-button" type="button" data-infrast-import="' + escapeHtml(item.path) + '">重新导入</button>'
          : '<button class="mini-button" type="button" data-infrast-import="' + escapeHtml(item.path) + '">导入</button>';
      return (
        '<div class="infrast-row' + (item.valid ? "" : " is-invalid") + (inUse ? " is-current" : "") + '">' +
        '<div class="infrast-meta"><strong>' + escapeHtml(item.title || item.name) + "</strong><span>" + escapeHtml(meta.join(" · ")) + "</span></div>" +
        button +
        "</div>"
      );
    })
    .join("");
  elements.infrastList.innerHTML =
    '<p class="hint">' + escapeHtml(scan.dir || "") + " 下找到 " + files.length + " 个文件</p>" + rows;
}

function scanInfrast(silent) {
  const scriptId = state.editing?.scriptId || state.selectedScript;
  if (!scriptId) return;
  const dir = elements.infrastDir ? String(elements.infrastDir.value || "").trim() : "";
  elements.infrastList.innerHTML = '<p class="hint">正在读目录…</p>';
  postApi("customInfrast/scan", { scriptId: scriptId, dir: dir })
    .then(function (data) {
      const scan = data.scan || {};
      state.customInfrastFiles = scan.files || [];
      if (elements.infrastDir && !elements.infrastDir.value && scan.dir) {
        elements.infrastDir.value = scan.dir;
      }
      renderInfrastList(scan);
      if (!scan.exists && !silent) showToast("目录不存在，检查一下路径。", true);
    })
    .catch(function (error) {
      elements.infrastList.innerHTML = '<p class="hint">没读成：' + escapeHtml(error.message) + "</p>";
      if (!silent) showToast(error.message, true);
    });
}

// 打开账号时自动扫一次，省得用户还得想起来点按钮
function autoScanInfrast() {
  const task = state.editing?.data?.Task;
  if (!task || !("InfrastMode" in task)) {
    state.customInfrastFiles = null;
    if (elements.infrastList) elements.infrastList.innerHTML = "";
    return;
  }
  if (state.customInfrastFiles !== null) {
    renderInfrastList({ dir: elements.infrastDir ? elements.infrastDir.value : "", exists: true, files: state.customInfrastFiles });
    return;
  }
  if (typeof featureOn === "function" && !featureOn("task_config")) return;
  scanInfrast(true);
}

async function refreshEditorData() {
  const editing = state.editing || {};
  if (!editing.scriptId || !editing.userId) return;
  try {
    const data = await postApi("user/detail", {
      scriptId: editing.scriptId,
      userId: editing.userId,
    });
    editing.data = data.config || editing.data;
    if (data.plans) editing.plans = data.plans;
    state.depotItems = null;
    state.cultivateOps = null;
    state.taskFoldScope = "";
    state.taskFoldOpen = [];
    syncFormFromData();
    state.editSnapshot = elements.json.value;
  } catch (error) {
    showToast(error.message, true);
  }
}

function importInfrast(jsonPath) {
  const editing = state.editing || {};
  if (!editing.scriptId || !editing.userId) {
    showToast("先在左边开一个账号再导入。", true);
    return;
  }
  if (!String(jsonPath || "").trim()) return;
  postApi("customInfrast/import", {
    scriptId: editing.scriptId,
    userId: editing.userId,
    jsonFile: jsonPath,
  })
    .then(function (data) {
      const info = data.imported || {};
      const mode = String(state.editing?.data?.Task?.InfrastMode || "Normal");
      showToast(info.message || "导入完成");
      return refreshEditorData().then(function () {
        if (mode !== "Custom") {
          showToast("基建模式不是「自定义」，排班表不会生效，去上面改一下。", true);
        }
      });
    })
    .catch(function (error) {
      showToast(error.message, true);
    });
}

// ---- 库存保持 / 活动库存 / 养成目标 ----

function parseTaskList(text) {
  try {
    const parsed = typeof text === "string" ? JSON.parse(text) : text;
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function taskList(key) {
  return parseTaskList(state.editing?.data?.Task?.[key]);
}

function writeTaskList(key, list) {
  const data = state.editing?.data;
  if (!data || !data.Task) return;
  data.Task[key] = JSON.stringify(list);
  elements.json.value = JSON.stringify(data, null, 2);
  renderTaskForm();
}

function isDigits(text) {
  const value = String(text == null ? "" : text);
  return value.length > 0 && String(Number(value)) === value && Number(value) >= 0;
}

function pairOptions(pairs, current, fallbackHint) {
  const value = current == null ? "" : String(current);
  const known = pairs.some((pair) => String(pair[0]) === value);
  let html = "";
  if (value && !known) {
    const suffix = fallbackHint ? "（" + fallbackHint + "）" : "";
    html += '<option value="' + escapeHtml(value) + '" selected>' + escapeHtml(value + suffix) + "</option>";
  }
  html += pairs
    .map(function (pair) {
      const selected = String(pair[0]) === value ? " selected" : "";
      return '<option value="' + escapeHtml(pair[0]) + '"' + selected + ">" + escapeHtml(pair[1]) + "</option>";
    })
    .join("");
  return html;
}

function depotMaterialPairs() {
  const items = Array.isArray(state.depotItems) ? state.depotItems : [];
  return items.map((item) => [String(item.value || ""), String(item.label || item.value || "")]);
}

function depotRow(item, index) {
  const row = item && typeof item === "object" ? item : {};
  const stage = row.Stage == null ? "" : String(row.Stage);
  const drop = row.DropId == null ? "" : String(row.DropId);
  const count = Number(row.DropCount) || 0;
  const pairs = depotMaterialPairs();
  const materialOptions = pairs.length
    ? pairOptions(pairs, drop, "")
    : '<option value="' + escapeHtml(drop) + '" selected>' + escapeHtml(drop || "材料列表没取到") + "</option>";
  return '<div class="plan-row">' +
    '<select class="task-input" data-depot-field="Stage" data-index="' + index + '">' + stageOptionsHtml(stage) + "</select>" +
    '<select class="task-input" data-depot-field="DropId" data-index="' + index + '">' + materialOptions + "</select>" +
    '<input class="task-input" type="number" min="1" data-depot-field="DropCount" data-index="' + index + '" value="' + count + '" />' +
    '<button class="mini-button is-danger" type="button" data-depot-remove="' + index + '">✕</button>' +
    "</div>";
}

function renderDepotSection(section) {
  const list = taskList(section.key);
  const rows = list.map((item, index) => depotRow(item, index)).join("");
  return '<section class="task-group">' +
    "<h3>" + escapeHtml(section.title) + ' <span class="task-sub">' + list.length + " 项</span></h3>" +
    '<p class="task-hint">每行 = 刷哪个关、刷什么材料、保底留多少个；MAA 按这份清单补库存。</p>' +
    '<div class="plan-rows">' + (rows || '<p class="task-hint">还没有条目。</p>') + "</div>" +
    '<button class="mini-button" type="button" data-depot-add="1">＋ 添加一行</button>' +
    "</section>";
}

function eventPool(kind) {
  const stages = (state.stageExtra || []).filter((item) => item && item.source === "activity");
  if (kind === "orundum") {
    return stages.filter((item) => String(item.dropName || "").includes("玉") || String(item.drop || "") === "30012");
  }
  if (kind === "material") {
    return stages.filter((item) => isDigits(item.drop) && !String(item.dropName || "").includes("玉"));
  }
  return stages;
}

function eventStageControl(kind, index, rowIndex) {
  const pool = eventPool(kind);
  const value = Number(index) || 1;
  if (!pool.length) {
    return '<input class="task-input" type="number" min="1" data-event-field="StageIndex" data-index="' + rowIndex + '" value="' + value + '" placeholder="活动关序号" />';
  }
  const pairs = pool.map((item, order) => [String(order + 1), item.label || item.value]);
  return '<select class="task-input" data-event-field="StageIndex" data-index="' + rowIndex + '">' + pairOptions(pairs, String(value), "") + "</select>";
}

function eventRow(item, index) {
  const row = item && typeof item === "object" ? item : {};
  const kind = String(row.StageType || "activity");
  const count = Number(row.DropCount) || 0;
  const orundum = Number(row.OrundumDropCount) || 0;
  return '<div class="plan-row">' +
    '<select class="task-input" data-event-field="StageType" data-index="' + index + '">' + pairOptions(EVENT_PLAN_TYPES, kind, "") + "</select>" +
    eventStageControl(kind, row.StageIndex, index) +
    '<input class="task-input" type="number" min="1" data-event-field="DropCount" data-index="' + index + '" value="' + count + '" />' +
    '<input class="task-input" type="number" min="1" data-event-field="OrundumDropCount" data-index="' + index + '" value="' + orundum + '" />' +
    '<label class="day-chip"><input type="checkbox" data-event-field="Skip" data-index="' + index + '"' + (row.Skip ? " checked" : "") + "><span>跳过</span></label>" +
    '<button class="mini-button is-danger" type="button" data-event-remove="' + index + '">✕</button>' +
    "</div>";
}

function renderEventDepotSection(section) {
  const list = taskList(section.key);
  const rows = list.map(function (item, index) {
    if (!item || typeof item !== "object") return "";
    if (item.StageType === "all") {
      return '<div class="plan-row">' +
        '<span class="task-label">全活动关预设</span>' +
        '<input class="task-input" type="number" min="1" data-event-field="DropCount" data-index="' + index + '" value="' + (Number(item.DropCount) || 0) + '" />' +
        '<input class="task-input" type="number" min="1" data-event-field="OrundumDropCount" data-index="' + index + '" value="' + (Number(item.OrundumDropCount) || 0) + '" />' +
        '<button class="mini-button is-danger" type="button" data-event-remove="' + index + '">✕</button>' +
        "</div>";
    }
    return eventRow(item, index);
  }).join("");
  return '<section class="task-group">' +
    "<h3>" + escapeHtml(section.title) + ' <span class="task-sub">' + list.length + " 项</span></h3>" +
    '<p class="task-hint">按当前活动关的序号保存，换期后序号可能指向别的关；指定行优先于「全活动关预设」。</p>' +
    '<div class="plan-rows">' + (rows || '<p class="task-hint">还没有条目。</p>') + "</div>" +
    '<button class="mini-button" type="button" data-event-add="all">＋ 全活动关预设</button> ' +
    '<button class="mini-button" type="button" data-event-add="row">＋ 指定活动关</button>' +
    "</section>";
}

function operatorPairs() {
  const ops = Array.isArray(state.cultivateOps) ? state.cultivateOps : [];
  return ops.map(function (item) {
    const rarity = Number(item.rarity) || 0;
    const prefix = rarity ? "★" + rarity + " · " : "";
    return [String(item.value || ""), prefix + String(item.label || item.value || "")];
  });
}

function goalTargetOptions(rowIndex, kind, current) {
  const target = taskList("CultivateTargets")[rowIndex] || {};
  const operator = (state.cultivateOps || []).find((item) => item && item.value === target.operator_id);
  const source = kind === "module" ? (operator && operator.modules) || [] : (operator && operator.skills) || [];
  const pairs = source.map((item) => [String(item.value || ""), String(item.label || item.value || "")]);
  if (!pairs.length) return '<option value="" selected>（先选干员）</option>';
  return pairOptions(pairs, current == null ? "" : String(current), "");
}

function goalRow(goal, rowIndex, goalIndex) {
  const row = goal && typeof goal === "object" ? goal : {};
  const kind = String(row.kind || "skill");
  const levels = CULTIVATE_LEVELS[kind] || [1];
  const levelPairs = levels.map((level) => [String(level), "Lv" + level]);
  const needTarget = kind === "mastery" || kind === "module";
  const targetCell = needTarget
    ? '<select class="task-input" data-goal-field="target_id" data-index="' + rowIndex + '" data-goal="' + goalIndex + '">' + goalTargetOptions(rowIndex, kind, row.target_id) + "</select>"
    : "";
  return '<div class="goal-row">' +
    '<select class="task-input" data-goal-field="kind" data-index="' + rowIndex + '" data-goal="' + goalIndex + '">' + pairOptions(CULTIVATE_KINDS, kind, "") + "</select>" +
    targetCell +
    '<select class="task-input" data-goal-field="to_level" data-index="' + rowIndex + '" data-goal="' + goalIndex + '">' + pairOptions(levelPairs, String(row.to_level || levels[0]), "") + "</select>" +
    '<button class="mini-button is-danger" type="button" data-goal-remove="' + rowIndex + ":" + goalIndex + '">✕</button>' +
    "</div>";
}

function targetRow(target, index) {
  const row = target && typeof target === "object" ? target : {};
  const goals = Array.isArray(row.goals) ? row.goals : [];
  const goalRows = goals.map((goal, goalIndex) => goalRow(goal, index, goalIndex)).join("");
  const pairs = operatorPairs();
  const operatorOptions = pairs.length
    ? pairOptions(pairs, String(row.operator_id || ""), "")
    : '<option value="' + escapeHtml(row.operator_id || "") + '" selected>' + escapeHtml(row.operator_id || "干员目录没取到") + "</option>";
  return '<div class="cultivate-row">' +
    '<div class="cultivate-head">' +
    '<select class="task-input" data-target-field="operator_id" data-index="' + index + '">' + operatorOptions + "</select>" +
    '<button class="mini-button is-danger" type="button" data-target-remove="' + index + '">✕</button>' +
    "</div>" +
    '<div class="goal-rows">' + (goalRows || '<p class="task-hint">这个干员还没加目标。</p>') + "</div>" +
    '<button class="mini-button" type="button" data-goal-add="' + index + '">＋ 加目标</button>' +
    "</div>";
}

function renderCultivateSection(section) {
  const list = taskList(section.key);
  const rows = list.map((target, index) => targetRow(target, index)).join("");
  return '<section class="task-group">' +
    "<h3>" + escapeHtml(section.title) + ' <span class="task-sub">' + list.length + " 名干员</span></h3>" +
    '<p class="task-hint">选干员 + 目标档位；专精和模组要再选具体技能或模组。</p>' +
    '<div class="cultivate-rows">' + (rows || '<p class="task-hint">还没有养成目标。</p>') + "</div>" +
    '<button class="mini-button" type="button" data-target-add="1">＋ 添加干员</button>' +
    "</section>";
}

// ---- MaaFW（识宝小助手这类 MaaFramework 项目）任务编排 ----

const MAAFW_TASK_TYPES = new Set(["MaaFWConfig", "M9AConfig", "MSSConfig"]);

// 账号配置里的 Task 只有 SelectedPreset 和 TaskSnapshot：后者是一串 JSON，
// 里面 taskOrder / taskChecked / taskOptions 才是真正的任务编排。
function maafwSnapshot() {
  const task = (state.editing && state.editing.data && state.editing.data.Task) || null;
  const raw = task ? task.TaskSnapshot : null;
  let parsed = null;
  if (typeof raw === "string" && raw.trim()) {
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      parsed = null;
    }
  } else if (raw && typeof raw === "object") {
    parsed = raw;
  }
  const order = Array.isArray(parsed && parsed.taskOrder) ? parsed.taskOrder.map(String) : [];
  const checked = {};
  const rawChecked = (parsed && parsed.taskChecked) || {};
  Object.keys(rawChecked).forEach(function (name) {
    checked[name] = rawChecked[name] !== false;
  });
  const options = {};
  const rawOptions = (parsed && parsed.taskOptions) || {};
  Object.keys(rawOptions).forEach(function (name) {
    const bag = rawOptions[name];
    options[name] = bag && typeof bag === "object" ? bag : {};
  });
  return { order: order, checked: checked, options: options, parsed: parsed || {} };
}

function writeMaafwSnapshot(next) {
  const payload = Object.assign({}, next.parsed || {}, {
    taskOrder: next.order.slice(),
    taskChecked: Object.assign({}, next.checked),
    taskOptions: Object.assign({}, next.options),
  });
  setConfigPath("Task.TaskSnapshot", JSON.stringify(payload));
  renderTaskForm();
}

function maafwTaskMeta() {
  const map = {};
  const defs = state.maafwDefs || {};
  (defs.tasks || []).forEach(function (item) {
    if (item && item.name) map[item.name] = item;
  });
  return map;
}

function maafwOptionRow(taskName, opt, value) {
  const path = taskName + "||" + opt.name;
  const label = escapeHtml(opt.label || opt.name);
  const hint = opt.description ? "<span class=\"ord-sub\">" + escapeHtml(opt.description) + "</span>" : "";
  if (value && typeof value === "object") {
    return (
      "<label class=\"task-field task-field-wide\"><span>" + label + "</span>" +
      "<textarea class=\"task-json\" rows=\"2\" data-mfw-opt=\"" + escapeHtml(path) + "\" data-mfw-json=\"1\">" +
      escapeHtml(JSON.stringify(value)) +
      "</textarea>" + hint + "</label>"
    );
  }
  if (opt.type === "switch" || opt.type === "boolean") {
    const on = value === true || String(value) === "Yes" || String(value) === "true";
    return (
      "<label class=\"check-inline task-field-wide\"><input type=\"checkbox\" data-mfw-opt=\"" + escapeHtml(path) + "\" data-mfw-switch=\"1\"" + (on ? " checked" : "") + " /><span>" + label + "</span></label>" + hint
    );
  }
  const cases = Array.isArray(opt.cases) ? opt.cases : [];
  const names = cases.map(function (item) { return String(item.name || ""); }).filter(Boolean);
  if (value != null && String(value) && names.indexOf(String(value)) < 0) names.unshift(String(value));
  if (opt.type === "input" || !names.length) {
    return (
      "<label class=\"task-field\"><span>" + label + "</span>" +
      "<input type=\"text\" data-mfw-opt=\"" + escapeHtml(path) + "\" value=\"" + escapeHtml(value == null ? "" : String(value)) + "\" />" +
      hint + "</label>"
    );
  }
  const options = names
    .map(function (name) {
      const item = cases.filter(function (c) { return String(c.name) === name; })[0];
      const text = item && item.label && item.label !== item.name ? item.label : name;
      return (
        "<option value=\"" + escapeHtml(name) + "\"" + (String(value) === name ? " selected" : "") + ">" +
        escapeHtml(text) +
        "</option>"
      );
    })
    .join("");
  return (
    "<label class=\"task-field\"><span>" + label + "</span>" +
    "<select data-mfw-opt=\"" + escapeHtml(path) + "\">" + options + "</select>" +
    hint + "</label>"
  );
}

function maafwOpenOf(taskName) {
  return (state.maafwOpenTasks || []).indexOf(taskName) >= 0;
}

function maafwTaskBlock(taskName, index, snapshot) {
  const meta = maafwTaskMeta()[taskName] || null;
  const options = meta && Array.isArray(meta.options) ? meta.options : [];
  const values = snapshot.options[taskName] || {};
  const checked = snapshot.checked[taskName] !== false;
  const rows = options
    .map(function (opt) {
      return maafwOptionRow(taskName, opt, values[opt.name]);
    })
    .join('');
  const hasOptions = options.length > 0;
  const opened = maafwOpenOf(taskName);
  const desc = meta && meta.description ? String(meta.description).trim() : '';
  const optionBtn = hasOptions
    ? '<button class="mini-button mfw-opt-btn" type="button" data-od="1" data-mfw-options="' + escapeHtml(taskName) + '" data-mfw-count="' + options.length + '">选项 ' + options.length + ' ' + (opened ? '▴' : '▾') + '</button>'
    : '';
  const detail = desc
    ? '<span class="mfw-detail" tabindex="0">详情<span class="mfw-tip">' + escapeHtml(desc) + '</span></span>'
    : '';
  const panel = hasOptions
    ? '<div class="mfw-opt-panel' + (opened ? '' : ' is-hidden') + '" data-mfw-panel="' + escapeHtml(taskName) + '"><div class="task-grid">' + rows + '</div></div>'
    : '';
  return (
    '<div class="ord-row mfw-row' + (checked ? '' : ' is-off') + '">' +
    '<label class="check-inline"><input type="checkbox" data-mfw-check="' + escapeHtml(taskName) + '"' + (checked ? ' checked' : '') + ' /><span class="ord-name">' +
    escapeHtml(taskName) +
    '</span></label>' +
    optionBtn +
    '<span class="ord-actions">' +
    '<button class="mini-button" type="button" data-od="1" data-mfw-up="' + index + '">↑</button>' +
    '<button class="mini-button" type="button" data-od="1" data-mfw-down="' + index + '">↓</button>' +
    detail +
    '<button class="mini-button is-danger" type="button" data-od="1" data-mfw-del="' + index + '">移除</button>' +
    '</span></div>' + panel
  );
}

function renderMaafwTaskForm(data) {
  const defs = state.maafwDefs;
  if (!defs) {
    return "<p class=\"hint\">正在读这个脚本的 interface.json…读不到的话，任务编排只能到「基础」页的完整配置 JSON 里改。</p>";
  }
  const snapshot = maafwSnapshot();
  const presets = Array.isArray(defs.presets) ? defs.presets : [];
  const currentPreset = String((data.Task || {}).SelectedPreset || "");
  const presetOptions = ["<option value=\"\">（不套用预设）</option>"]
    .concat(
      presets.map(function (item) {
        return (
          "<option value=\"" + escapeHtml(item.name) + "\"" + (currentPreset === item.name ? " selected" : "") + ">" +
          escapeHtml(item.label || item.name) +
          "</option>"
        );
      }),
    )
    .join("");
  const presetHtml = presets.length
    ? "<div class=\"ord-block\"><div class=\"ord-head\"><span>官方预设（一键填任务清单）</span></div>" +
      "<div class=\"task-grid\"><label class=\"task-field\"><span>预设</span><select id=\"mfw-preset\">" + presetOptions + "</select></label></div>" +
      "<div class=\"inline-form-actions\"><button class=\"mini-button\" type=\"button\" data-od=\"1\" data-mfw-apply=\"1\">套用这个预设</button></div></div>"
    : "";
  const rows = snapshot.order
    .map(function (name, index) {
      return maafwTaskBlock(name, index, snapshot);
    })
    .join("");
  const picked = snapshot.order.slice();
  const rest = (defs.tasks || []).filter(function (item) {
    return item && item.name && picked.indexOf(item.name) < 0;
  });
  const restHtml = rest.length
    ? "<p class=\"hint\">还没加入编排的任务（点一下加到最后，勾选状态继承默认）：</p><div class=\"chip-row\">" +
      rest
        .map(function (item) {
          return (
            "<button class=\"chip-add\" type=\"button\" data-od=\"1\" data-mfw-add=\"" + escapeHtml(item.name) + "\">+ " + escapeHtml(item.name) + "</button>"
          );
        })
        .join("") +
      "</div>"
    : "";
  const intro =
    "这是什么脚本都能配的通用任务编排：勾上要跑的任务、用 ↑↓ 调顺序，每个任务下面可以展开它的选项；" +
     "任务名和选项都来自脚本自己的 interface.json，不写死。";
  return (
    "<p class=\"hint\">" + escapeHtml(intro) + "</p>" +
    presetHtml +
    "<div class=\"ord-block\"><div class=\"ord-head\"><span>任务顺序（勾选 = 这次运行要做）</span><span class=\"ord-tag\">" + snapshot.order.length + " 个任务</span></div>" +
    (rows || "<p class=\"hint\">还没有任务，先从下面挑。</p>") +
    "</div>" +
    restHtml
  );
}

function loadMaafwDefinition() {
  const info = currentScriptInfo();
  const scriptId = (state.editing && state.editing.scriptId) || "";
  if (!info || !MAAFW_TASK_TYPES.has(String(info.type || "")) || !scriptId) return;
  if (state.maafwScript === scriptId) return;
  state.maafwScript = scriptId;
  state.maafwDefs = null;
  callApi("maafw/definition", { scriptId: scriptId })
    .then(function (data) {
      if (state.maafwScript !== scriptId) return;
      const defs = (data && data.definition) || null;
      state.maafwDefs = defs;
      renderTaskForm();
    })
    .catch(function () {
      if (state.maafwScript === scriptId) state.maafwDefs = { tasks: [], presets: [], groups: [] };
    });
}

function handleMaafwClick(node) {
  const attr = function (name) { return node.getAttribute(name); };
  const has = function (name) { return node.hasAttribute(name); };
  if (has("data-mfw-add")) {
    const name = String(attr("data-mfw-add") || "");
    const snapshot = maafwSnapshot();
    if (name && snapshot.order.indexOf(name) < 0) {
      snapshot.order.push(name);
      if (snapshot.checked[name] === undefined) {
        const meta = maafwTaskMeta()[name];
        snapshot.checked[name] = meta ? meta.defaultCheck !== false : true;
      }
      writeMaafwSnapshot(snapshot);
    }
    return true;
  }
  if (has('data-mfw-options')) {
    const name = String(attr('data-mfw-options') || '');
    const list = Array.isArray(state.maafwOpenTasks) ? state.maafwOpenTasks.slice() : [];
    const at = list.indexOf(name);
    const opening = at < 0;
    if (opening) list.push(name);
    else list.splice(at, 1);
    state.maafwOpenTasks = list;
    if (elements.taskForm) {
      const panels = elements.taskForm.querySelectorAll('[data-mfw-panel]');
      Array.prototype.forEach.call(panels, function (panel) {
        if (String(panel.getAttribute('data-mfw-panel')) !== name) return;
        if (opening) panel.classList.remove('is-hidden');
        else panel.classList.add('is-hidden');
      });
    }
    const count = String(attr('data-mfw-count') || '');
    node.textContent = '选项 ' + count + ' ' + (opening ? '▴' : '▾');
    return true;
  }
  if (has('data-mfw-del')) {
    const snapshot = maafwSnapshot();
    const index = Number(attr("data-mfw-del"));
    if (index >= 0 && index < snapshot.order.length) {
      snapshot.order.splice(index, 1);
      writeMaafwSnapshot(snapshot);
    }
    return true;
  }
  if (has("data-mfw-up") || has("data-mfw-down")) {
    const snapshot = maafwSnapshot();
    const up = has("data-mfw-up");
    snapshot.order = moveListItem(snapshot.order, Number(attr(up ? "data-mfw-up" : "data-mfw-down")), up ? -1 : 1);
    writeMaafwSnapshot(snapshot);
    return true;
  }
  if (has("data-mfw-apply")) {
    const snapshot = maafwSnapshot();
    const select = document.getElementById("mfw-preset");
    const name = select ? String(select.value || "") : "";
    const presets = (state.maafwDefs && state.maafwDefs.presets) || [];
    const preset = presets.filter(function (item) { return item && item.name === name; })[0];
    if (!preset) {
      showToast("先选一个预设。", true);
      return true;
    }
    const order = [];
    const checked = Object.assign({}, snapshot.checked);
    (preset.tasks || []).forEach(function (item) {
      if (!item || !item.name) return;
      if (order.indexOf(item.name) < 0) order.push(item.name);
      checked[item.name] = item.enabled !== false;
    });
    snapshot.order = order;
    snapshot.checked = checked;
    setConfigPath("Task.SelectedPreset", preset.name);
    writeMaafwSnapshot(snapshot);
    return true;
  }
  return false;
}

function handleMaafwChange(target) {
  const meta = target.dataset || {};
  if (meta.mfwCheck) {
    const snapshot = maafwSnapshot();
    snapshot.checked[meta.mfwCheck] = Boolean(target.checked);
    writeMaafwSnapshot(snapshot);
    return true;
  }
  if (meta.mfwOpt) {
    const parts = String(meta.mfwOpt).split("||");
    const taskName = parts[0];
    const optName = parts[1];
    const snapshot = maafwSnapshot();
    const bag = Object.assign({}, snapshot.options[taskName] || {});
    if (meta.mfwSwitch === "1") {
      bag[optName] = target.checked ? "Yes" : "No";
    } else if (meta.mfwJson === "1") {
      try {
        bag[optName] = JSON.parse(target.value);
      } catch (error) {
        target.classList.add("is-invalid");
        return true;
      }
    } else {
      bag[optName] = target.value;
    }
    snapshot.options[taskName] = bag;
    writeMaafwSnapshot(snapshot);
    return true;
  }
  return false;
}


function ensureTaskLists() {
  const scriptId = state.editing?.scriptId || "";
  const userId = state.editing?.userId || "";
  if (!scriptId) return;
  if (state.depotItems === null) {
    state.depotItems = [];
    callApi("depot/items", { scriptId })
      .then(function (data) {
        state.depotItems = Array.isArray(data.items) ? data.items : [];
        renderTaskForm();
      })
      .catch(function () {});
  }
  if (state.cultivateOps === null && userId) {
    state.cultivateOps = [];
    postApi("cultivate/operators", { scriptId: scriptId, userId: userId })
      .then(function (data) {
        state.cultivateOps = Array.isArray(data.operators) ? data.operators : [];
        renderTaskForm();
      })
      .catch(function () {});
  }
}

function commitTaskListValue(target) {
  const meta = target.dataset || {};
  const index = Number(meta.index);
  if (meta.depotField) {
    const list = taskList("DepotMaintainPlans");
    const item = list[index] && typeof list[index] === "object" ? list[index] : {};
    if (meta.depotField === "DropCount") item.DropCount = Number(target.value) || 0;
    else item[meta.depotField] = target.value;
    list[index] = item;
    writeTaskList("DepotMaintainPlans", list);
    return;
  }
  if (meta.eventField) {
    const list = taskList("EventDepotMaintainPlans");
    const item = list[index] && typeof list[index] === "object" ? list[index] : {};
    if (meta.eventField === "Skip") item.Skip = Boolean(target.checked);
    else if (meta.eventField === "StageType") item.StageType = target.value;
    else if (meta.eventField === "StageIndex") item.StageIndex = Number(target.value) || 1;
    else if (meta.eventField === "DropCount" || meta.eventField === "OrundumDropCount") {
      item[meta.eventField] = Number(target.value) || 0;
    } else item[meta.eventField] = target.value;
    list[index] = item;
    writeTaskList("EventDepotMaintainPlans", list);
    return;
  }
  if (meta.targetField) {
    const list = taskList("CultivateTargets");
    const item = list[index] && typeof list[index] === "object" ? list[index] : { goals: [] };
    item[meta.targetField] = target.value;
    if (!Array.isArray(item.goals)) item.goals = [];
    list[index] = item;
    writeTaskList("CultivateTargets", list);
    return;
  }
  if (meta.goalField) {
    const list = taskList("CultivateTargets");
    const item = list[index] && typeof list[index] === "object" ? list[index] : { goals: [] };
    const goals = Array.isArray(item.goals) ? item.goals : [];
    const goalIndex = Number(meta.goal);
    const goal = goals[goalIndex] && typeof goals[goalIndex] === "object" ? goals[goalIndex] : {};
    if (meta.goalField === "kind") {
      goal.kind = target.value;
      goal.target_id = "";
      goal.to_level = (CULTIVATE_LEVELS[goal.kind] || [1])[0];
    } else if (meta.goalField === "to_level") {
      goal.to_level = Number(target.value) || 1;
    } else {
      goal.target_id = target.value;
    }
    if (!goal.state) goal.state = "not_started";
    goals[goalIndex] = goal;
    item.goals = goals;
    list[index] = item;
    writeTaskList("CultivateTargets", list);
  }
}

function handleTaskListClick(node) {
  if (node.hasAttribute("data-depot-add")) {
    const list = taskList("DepotMaintainPlans");
    list.push({ Stage: "", DropId: "", DropCount: 100 });
    writeTaskList("DepotMaintainPlans", list);
    return;
  }
  if (node.hasAttribute("data-depot-remove")) {
    const list = taskList("DepotMaintainPlans");
    list.splice(Number(node.getAttribute("data-depot-remove")), 1);
    writeTaskList("DepotMaintainPlans", list);
    return;
  }
  if (node.hasAttribute("data-event-add")) {
    const mode = node.getAttribute("data-event-add");
    const list = taskList("EventDepotMaintainPlans");
    if (mode === "all") list.push({ StageType: "all", DropCount: 999, OrundumDropCount: 9999 });
    else list.push({ StageType: "activity", StageIndex: 1, DropCount: 999, OrundumDropCount: 9999 });
    writeTaskList("EventDepotMaintainPlans", list);
    return;
  }
  if (node.hasAttribute("data-event-remove")) {
    const list = taskList("EventDepotMaintainPlans");
    list.splice(Number(node.getAttribute("data-event-remove")), 1);
    writeTaskList("EventDepotMaintainPlans", list);
    return;
  }
  if (node.hasAttribute("data-target-add")) {
    const list = taskList("CultivateTargets");
    list.push({ operator_id: "", goals: [] });
    writeTaskList("CultivateTargets", list);
    return;
  }
  if (node.hasAttribute("data-target-remove")) {
    const list = taskList("CultivateTargets");
    list.splice(Number(node.getAttribute("data-target-remove")), 1);
    writeTaskList("CultivateTargets", list);
    return;
  }
  if (node.hasAttribute("data-goal-add")) {
    const index = Number(node.getAttribute("data-goal-add"));
    const list = taskList("CultivateTargets");
    const item = list[index] && typeof list[index] === "object" ? list[index] : { goals: [] };
    if (!Array.isArray(item.goals)) item.goals = [];
    item.goals.push({ kind: "skill", target_id: "", to_level: 2, state: "not_started" });
    list[index] = item;
    writeTaskList("CultivateTargets", list);
    return;
  }
  if (node.hasAttribute("data-goal-remove")) {
    const parts = String(node.getAttribute("data-goal-remove")).split(":");
    const index = Number(parts[0]);
    const goalIndex = Number(parts[1]);
    const list = taskList("CultivateTargets");
    const item = list[index];
    if (item && Array.isArray(item.goals)) {
      item.goals.splice(goalIndex, 1);
      writeTaskList("CultivateTargets", list);
    }
  }
}

function commitTaskValue(target) {
  if (handleOneDragonControl(target)) return;
  if (target.hasAttribute && (target.hasAttribute("data-conf-path") || (target.closest && target.closest("[data-multi]")))) {
    commitConfigValue(target);
    return;
  }
  const listMeta = target.dataset || {};
  if (listMeta.depotField || listMeta.eventField || listMeta.targetField || listMeta.goalField) {
    commitTaskListValue(target);
    return;
  }
  if (target.dataset && target.dataset.stage === "1") {
    if (target.value === "__custom") {
      const code = String(window.prompt("输入关卡代码（例如 AT-6、LS-6）", "") || "").trim();
      if (!code) {
        target.value = target.dataset.prev || "";
        return;
      }
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = code + "（自定义）";
      target.insertBefore(opt, target.lastElementChild);
      target.value = code;
      target.dataset.prev = code;
    } else {
      target.dataset.prev = target.value;
    }
  }
  const data = state.editing?.data;
  const group = target.dataset?.group;
  const key = target.dataset?.key;
  if (!data || !group || !key) return;
  const bag = data[group];
  if (!bag || typeof bag !== "object") return;
  if (target.type === "checkbox") {
    bag[key] = target.checked;
  } else if (target.type === "number") {
    const num = Number(target.value);
    bag[key] = Number.isFinite(num) ? Math.trunc(num) : 0;
  } else if (target.dataset && target.dataset.kind === "json") {
    const raw = String(target.value || "").trim();
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      bag[key] = typeof bag[key] === "string" ? String(target.value) : parsed;
      target.classList.remove("is-invalid");
    } catch (error) {
      target.classList.add("is-invalid");
      return;
    }
  } else {
    bag[key] = target.value;
  }
  // 同步「完整配置 JSON」，保存走 textarea 时可视化改动不会丢。
  elements.json.value = JSON.stringify(data, null, 2);
}

function validateTaskJson(target) {
  if (!target.classList?.contains("task-json")) return;
  try {
    JSON.parse(target.value);
    target.classList.remove("is-invalid");
  } catch (error) {
    target.classList.add("is-invalid");
  }
}

function switchTab(name) {
  if (name === "task" && state.editing && taskBaseMode() === "native") {
    showToast("配置基线是原生，任务由脚本自己决定；改成独立/共享才有任务可选。", true);
    return;
  }
  state.activeTab = name;
  elements.tabs.forEach((tab) => {
    const active = tab.dataset.tab === name;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  });
  elements.panels.forEach((panel) => {
    panel.classList.toggle("is-hidden", panel.dataset.panel !== name);
  });
  if (name === "task") renderTaskForm();
}

// 抽屉里有没有改过还没存的东西：跟打开时记下的快照比，改回原样就不算脏。
function drawerDirty() {
  if (elements.drawer.classList.contains("is-hidden")) return false;

  if (!state.editing) return false;
  return elements.json.value !== state.editSnapshot;
}

let confirmResolve = null;

// choices: 允许出现哪些按钮 —— "cancel" 取消、 "discard" 不保存、 "save" 保存。
// 返回用户点的那个值，点遮罩和按 ESC 都当取消。
function askConfirm(text, choices) {
  return new Promise((resolve) => {
    confirmResolve = resolve;
    const list = choices || ["cancel", "discard"];
    if (elements.confirmText) elements.confirmText.textContent = text;
    if (elements.confirmOk) elements.confirmOk.classList.toggle("is-hidden", list.indexOf("discard") < 0);
    if (elements.confirmSave) elements.confirmSave.classList.toggle("is-hidden", list.indexOf("save") < 0);
    if (elements.confirmCancel) {
      elements.confirmCancel.textContent = list.indexOf("save") >= 0 ? "取消" : "继续编辑";
      elements.confirmCancel.focus();
    }
    if (elements.confirm) elements.confirm.classList.remove("is-hidden");
  });
}

function settleConfirm(choice) {
  if (elements.confirm) elements.confirm.classList.add("is-hidden");
  const fn = confirmResolve;
  confirmResolve = null;
  const value = choice === true ? "discard" : choice === false ? "cancel" : choice;
  if (fn) fn(value);
}

// 关抽屉：有未保存改动就三选（取消 / 不保存 / 保存）。
async function requestCloseDrawer() {
  if (!drawerDirty()) {
    closeDrawer();
    return;
  }
  const choice = await askConfirm("有还没保存的改动，要保存吗？", ["cancel", "discard", "save"]);
  if (choice === "cancel") return;
  if (choice === "save") {
    await saveEditor();
    return;
  }
  closeDrawer();
}

function closeDrawer() {
  state.editing = null;
  elements.drawer.classList.add("is-hidden");
}

// ---- 托管项抽屉（跟账号抽屉完全分开） ----

function scriptDrawerOpen() {
  return Boolean(elements.scriptDrawer) && !elements.scriptDrawer.classList.contains("is-hidden");
}

// 当前在看的托管项：托管抽屉优先，其次账号所属托管项。
function activeScriptId() {
  return state.scriptDrawerScript || (state.editing && state.editing.scriptId) || state.selectedScript || "";
}

// 托管项抽屉里有没有改过还没存的东西。
function scriptDrawerDirty() {
  if (!scriptDrawerOpen() || !state.scriptEditing) return false;
  return elements.scriptJson.value !== state.scriptSnapshot;
}

async function requestCloseScriptDrawer() {
  if (!scriptDrawerDirty()) {
    closeScriptDrawer();
    return;
  }
  const choice = await askConfirm("托管项有还没保存的改动，要保存吗？", ["cancel", "discard", "save"]);
  if (choice === "cancel") return;
  if (choice === "save") {
    await saveScript();
    return;
  }
  closeScriptDrawer();
}

function closeScriptDrawer() {
  state.scriptEditing = null;
  state.scriptSnapshot = "";
  state.scriptDrawerScript = "";
  if (elements.scriptDrawer) elements.scriptDrawer.classList.add("is-hidden");
}

async function saveEditor() {

  if (!state.editing || state.busy) return;
  let data;
  try {
    data = JSON.parse(elements.json.value);
  } catch (error) {
    elements.saveState.textContent = "JSON 格式不对，先修一下";
    return;
  }
  if (!data.Info) data.Info = {};
  data.Info.Name = elements.fieldName.value.trim();
  data.Info.Status = elements.fieldStatus.checked;
  data.Info.IfQuickConfig = elements.fieldQuick.checked;
  data.Info.Base = elements.fieldBase.value;

  state.busy = true;
  elements.drawerSave.disabled = true;
  elements.saveState.textContent = "保存中…";
  try {
    await postApi("user/save", {
      scriptId: state.editing.scriptId,
      userId: state.editing.userId,
      data,
    });
    showToast("已保存");
    const scriptId = state.editing.scriptId;
    closeDrawer();
    await selectScript(scriptId);
  } catch (error) {
    elements.saveState.textContent = error.message;
  } finally {
    state.busy = false;
    elements.drawerSave.disabled = false;
  }
}

function bindEvents() {
  elements.refresh.addEventListener("click", loadOverview);
  elements.viewTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });
  if (elements.planCreate) elements.planCreate.addEventListener("click", createPlan);
  if (elements.planSave) elements.planSave.addEventListener("click", savePlan);
  if (elements.planDelete) elements.planDelete.addEventListener("click", deletePlan);
  if (elements.queueCreate) elements.queueCreate.addEventListener("click", createQueue);
  if (elements.queueSave) elements.queueSave.addEventListener("click", saveQueue);
  if (elements.queueDelete) elements.queueDelete.addEventListener("click", deleteQueue);
  if (elements.queueRun) elements.queueRun.addEventListener("click", runQueue);
  if (elements.histSearch) elements.histSearch.addEventListener("click", loadHistory);
  if (elements.scriptCreate) elements.scriptCreate.addEventListener("click", openScriptCreate);
  if (elements.timedRefresh) elements.timedRefresh.addEventListener("click", () => loadTimed());
  if (elements.bindingCreate) elements.bindingCreate.addEventListener("click", startBindingDraft);
  if (elements.bindingDelete) {
    elements.bindingDelete.addEventListener("click", function () {
      if (!state.selectedBinding) return;
      askConfirm("把这个人的绑定全清了？", ["cancel", "discard"]).then(function (choice) {
        if (choice !== "discard") return;
        removeBinding(state.selectedBinding, "");
      });
    });
  }
  if (elements.scriptConfig) elements.scriptConfig.addEventListener("click", openScriptDrawer);
  if (elements.scriptDelete) elements.scriptDelete.addEventListener("click", deleteScript);
  if (elements.scriptStart) elements.scriptStart.addEventListener("click", startScript);
  if (elements.webhookCreate) elements.webhookCreate.addEventListener("click", createWebhook);
  if (elements.emulatorCreate) elements.emulatorCreate.addEventListener("click", createEmulator);
  if (elements.emulatorSave) elements.emulatorSave.addEventListener("click", saveEmulator);
  if (elements.emulatorDelete) elements.emulatorDelete.addEventListener("click", deleteEmulator);
  if (elements.emulatorSearch) elements.emulatorSearch.addEventListener("click", searchEmulators);
  if (elements.settingTest) elements.settingTest.addEventListener("click", testNotify);
  if (elements.scriptForm) {
    elements.scriptForm.addEventListener("change", (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && isSchemaField(target)) commitScriptValue(target);
    });
    elements.scriptForm.addEventListener("click", (event) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (!target) return;
      if (target.closest("#maaend-native-retry")) {
        loadMaaendNative(activeScriptId());
        return;
      }
      const save = target.closest("[data-native-task]");
      if (save) saveMaaendNative(save.getAttribute("data-native-task"), save);
    });
  }
  if (elements.emulatorEditor) {
    elements.emulatorEditor.addEventListener("change", (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && isSchemaField(target)) commitEmulatorValue(target);
    });
  }
  if (elements.settingEditor) {
    elements.settingEditor.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.dataset.settingKey) persistSetting(target);
      else if (target.dataset.webhookPath) commitWebhookField(target);
    });
    elements.settingEditor.addEventListener("click", (event) => {
      const node = event.target instanceof HTMLElement ? event.target.closest("[data-sub-remove]") : null;
      if (!node) return;
      removeSubscriber(node.dataset.subRemove || "");
    });
  }
  if (elements.queueEditor) {
    elements.queueEditor.addEventListener("change", (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.dataset.group) commitQueueField(target);
    });
    elements.queueEditor.addEventListener("click", (event) => {
      const node = event.target instanceof HTMLElement ? event.target.closest("button") : null;
      if (!node || !elements.queueEditor.contains(node)) return;
      if (node.id === "qi-add") {
        queueItemAdd();
        return;
      }
      if (node.id === "qt-add") {
        queueTimeAdd();
        return;
      }
      const host = node.closest("[data-item],[data-time]");
      if (!host) return;
      if (node.hasAttribute("data-qi-up") && host.dataset.item) queueItemMove(host.dataset.item, -1);
      else if (node.hasAttribute("data-qi-down") && host.dataset.item) queueItemMove(host.dataset.item, 1);
      else if (node.hasAttribute("data-qi-del") && host.dataset.item) queueItemDelete(host.dataset.item);
      else if (node.hasAttribute("data-qt-del") && host.dataset.time) queueTimeDelete(host.dataset.time);
    });
  }
  elements.drawerClose.addEventListener("click", requestCloseDrawer);
  elements.drawerCancel.addEventListener("click", requestCloseDrawer);
  if (elements.drawer) {
    // 只有按下和松开都在遮罩上才算点遮罩：从抽屉里往外拖选文字时松手不会误关。
    let downOnOverlay = false;
    elements.drawer.addEventListener("mousedown", (event) => {
      downOnOverlay = event.target === elements.drawer;
    });
    elements.drawer.addEventListener("click", (event) => {
      if (event.target !== elements.drawer || !downOnOverlay) return;
      downOnOverlay = false;
      requestCloseDrawer();
    });
  }
  if (elements.scriptDrawerClose) elements.scriptDrawerClose.addEventListener("click", requestCloseScriptDrawer);
  if (elements.scriptDrawerCancel) elements.scriptDrawerCancel.addEventListener("click", requestCloseScriptDrawer);
  if (elements.scriptDrawerSave) elements.scriptDrawerSave.addEventListener("click", saveScript);
  if (elements.scriptDrawer) {
    let downOnScriptOverlay = false;
    elements.scriptDrawer.addEventListener("mousedown", (event) => {
      downOnScriptOverlay = event.target === elements.scriptDrawer;
    });
    elements.scriptDrawer.addEventListener("click", (event) => {
      if (event.target !== elements.scriptDrawer || !downOnScriptOverlay) return;
      downOnScriptOverlay = false;
      requestCloseScriptDrawer();
    });
  }
  if (elements.confirmOk) elements.confirmOk.addEventListener("click", () => settleConfirm("discard"));
  if (elements.confirmSave) elements.confirmSave.addEventListener("click", () => settleConfirm("save"));
  if (elements.confirmCancel) elements.confirmCancel.addEventListener("click", () => settleConfirm("cancel"));
  if (elements.confirm) {
    elements.confirm.addEventListener("click", (event) => {
      if (event.target === elements.confirm) settleConfirm("cancel");
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (elements.confirm && !elements.confirm.classList.contains("is-hidden")) {
      settleConfirm("cancel");
      return;
    }
    if (scriptDrawerOpen()) {
      requestCloseScriptDrawer();
      return;
    }
    if (!elements.drawer.classList.contains("is-hidden")) requestCloseDrawer();
  });
  elements.drawerSave.addEventListener("click", saveEditor);
  elements.userCreate.addEventListener("click", createUser);
  [elements.fieldName, elements.fieldStatus, elements.fieldQuick, elements.fieldBase].forEach((node) =>
    node.addEventListener("change", syncDataFromForm),
  );
  elements.fieldBase.addEventListener("change", () => renderTaskForm());
  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });
  elements.taskForm.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (handleSupplyChange(target)) return;
    if (handleOknteChange(target)) return;
    if (handleWhimboxChange(target)) return;
    if (handleMaafwChange(target)) return;
    if (target.hasAttribute("data-zzz-team-name") || target.hasAttribute("data-zzz-team-ab")) {
      commitZzzTeamValue(target);
      return;
    }
    commitTaskValue(target);
  });
  if (elements.infrastScan) elements.infrastScan.addEventListener("click", function () { scanInfrast(false); });
  if (elements.infrastList) {
    elements.infrastList.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const node = target.closest("[data-infrast-import]");
      if (node) importInfrast(node.getAttribute("data-infrast-import"));
    });
  }
  elements.taskForm.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest("#oknte-save")) {
      saveOknteConfigs();
      return;
    }
    if (target.closest("#zzz-team-save")) {
      saveZzzTeams();
      return;
    }
    if (target.closest("#maaend-user-retry")) {
      loadMaaendNativeFor("user", activeScriptId(), (state.editing && state.editing.userId) || "");
      return;
    }
    const nativeSave = target.closest("[data-native-task]");
    if (nativeSave) {
      saveMaaendNative(nativeSave.getAttribute("data-native-task"), nativeSave);
      return;
    }
    const selector = [
      "[data-depot-add]",
      "[data-depot-remove]",
      "[data-event-add]",
      "[data-event-remove]",
      "[data-target-add]",
      "[data-target-remove]",
      "[data-goal-add]",
      "[data-goal-remove]",
      "[data-od]",
      "[data-whim-reset]",
      "[data-oknte-move]",
      "[data-sanity-strategy]",
      "[data-supply-cat]",
    ].join(",");
    const node = target.closest(selector);
    if (!node) return;
    if (handleSupplyClick(node)) return;
    if (node.hasAttribute("data-oknte-move")) {
      handleOknteClick(node);
      return;
    }
    if (node.hasAttribute("data-whim-reset")) {
      handleWhimboxClick(node);
      return;
    }
    if (node.hasAttribute("data-od")) {
      if (handleMaafwClick(node)) return;
      handleOneDragonClick(node);
      return;
    }
    handleTaskListClick(node);
  });
  if (elements.schedStart) elements.schedStart.addEventListener("click", schedStart);
  if (elements.schedRefresh) elements.schedRefresh.addEventListener("click", () => loadScheduler());
  if (elements.schedTarget) {
    elements.schedTarget.addEventListener("change", async () => {
      setSchedTarget(elements.schedTarget.value);
      state.schedSelectedUsers = null;
      if (!state.schedScopeCache) state.schedScopeCache = {};
      await loadSchedScope();
    });
  }
  if (elements.schedUsersAll) elements.schedUsersAll.addEventListener("click", () => selectAllSchedUsers(true));
  if (elements.schedUsersNone) elements.schedUsersNone.addEventListener("click", () => selectAllSchedUsers(false));
  if (elements.schedUsers) elements.schedUsers.addEventListener("change", onSchedUserToggle);
  if (elements.schedTasks) elements.schedTasks.addEventListener("click", onSchedTasksClick);
  if (elements.schedPowerApply) elements.schedPowerApply.addEventListener("click", schedPowerApply);
  if (elements.schedPowerCancel) elements.schedPowerCancel.addEventListener("click", schedPowerCancel);
  elements.taskForm.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (handleSupplyInput(target)) return;
    validateTaskJson(target);
  });
}

async function main() {
  bindEvents();
  if (!bridge) {
    setRuntime("未连接 Dashboard", "offline");
    setError("bridge SDK 没加载，页面可能被浏览器缓存或注入位置不对。");
    return;
  }
  try {
    await bridge.ready();
  } catch (error) {
    setRuntime("握手失败", "offline");
    setError(error.message);
    return;
  }
  switchView("scripts");
  await loadStageOptions();
  await loadOverview();
  renderUsers();
}

main();
