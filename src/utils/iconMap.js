import React from 'react';
import {
  MagnifyingGlass,
  PuzzlePiece,
  ChatCircle,
  Users,
  Flag,
  RocketLaunch,
  CheckSquare,
  ShieldCheck,
  TrendUp,
  Calculator,
  Lightbulb,
  GlobeHemisphereWest,
  Target,
  Gear,
  Heart,
  Link,
  Eye,
  Scales,
  Strategy,
  ChartLineUp,
  Question,
  Sparkle,
  Compass,
  Wrench,
  BookOpen,
  ClipboardText,
  MapPin,
  Binoculars,
  Lightning,
  Palette,
  Leaf,
  FileText,
  Database,
  Code,
  Bank,
  FirstAidKit,
  GraduationCap,
  Megaphone,
  Briefcase,
} from 'phosphor-react';

import {
  FaLaptopCode,
  FaBalanceScale,
  FaUniversity,
  FaBullhorn,
  FaGlobeEurope,
  FaUserMd,
  FaChartLine,
  FaBriefcase,
  FaComments,
  FaHandshake,
  FaUserFriends,
  FaClipboardCheck,
  FaSearchPlus,
  FaHandsHelping,
  FaTooth,
  FaPills,
  FaUserNurse,
  FaBaby,
  FaAmbulance,
  FaXRay,
  FaEye,
  FaRunning,
  FaBrain,
  FaDna,
  FaFlask,
  FaAtom,
  FaMicroscope,
  FaCalculator,
  FaChartBar,
  FaRobot,
  FaShieldAlt,
  FaGamepad,
  FaCogs,
  FaPlane,
  FaHardHat,
  FaBolt,
  FaDraftingCompass,
  FaBuilding,
  FaCity,
  FaTree,
  FaGavel,
  FaFingerprint,
  FaLandmark,
  FaGlobeAmericas,
  FaGlobeAfrica,
  FaCoins,
  FaUsers,
  FaTruck,
  FaRocket,
  FaHashtag,
  FaNewspaper,
  FaPalette,
  FaObjectGroup,
  FaFilm,
  FaTshirt,
  FaPaintBrush,
  FaPenNib,
  FaLeaf as FaLeafIcon,
  FaCloudSun,
  FaSeedling,
  FaMountain,
  FaLanguage,
  FaBook,
  FaBookOpen,
  FaChalkboardTeacher,
  FaChild,
  FaHeartbeat,
  FaInfinity,
  FaChartArea,
  FaUmbrella,
  FaProjectDiagram,
  FaMoneyBillWave,
  FaSquareRootAlt,
  FaCode,
  FaLock,
  FaMicrochip,
  FaMousePointer,
  FaIndustry,
  FaNetworkWired,
  FaRulerCombined,
  FaCouch,
  FaMapMarkedAlt,
  FaVials,
  FaGlobe,
  FaCapsules,
  FaBone,
  FaDumbbell,
  FaSchool,
  FaFutbol,
  FaScroll,
  FaChartPie,
  FaUserTie,
  FaFileInvoiceDollar,
  FaMoneyCheckAlt,
  FaBitcoin,
  FaHandHoldingUsd,
  FaCubes,
  FaCube,
  FaMagic,
  FaVideo,
  FaAd,
  FaRecycle,
  FaSolarPanel,
  FaMonument,
  FaHandHoldingHeart,
  FaPrescriptionBottleAlt,
} from 'react-icons/fa';

import {
  MdEngineering,
  MdScience,
  MdHealthAndSafety,
  MdPsychology,
  MdSchool,
  MdArchitecture,
  MdDesignServices,
  MdBiotech,
} from 'react-icons/md';

import {
  BsBuildings,
  BsGraphUpArrow,
  BsBank,
  BsClipboardData,
} from 'react-icons/bs';

// Tabler: thin, consistent outline family we are standardising on.
import {
  TbChartHistogram,
  TbCode,
  TbTools,
  TbBuilding,
  TbMicroscope,
  TbStethoscope,
  TbBrain,
  TbSchool,
  TbGavel,
  TbBriefcase,
  TbBuildingBank,
  TbRocket,
  TbSpeakerphone,
  TbPalette,
  TbLeaf,
  TbWorld,
  TbHammer,
  TbNeedleThread,
  TbChefHat,
  TbMathSymbols,
  TbChartDots,
  TbInfinity,
  TbChartBar,
  TbUmbrella,
  TbRoute,
  TbCoin,
  TbChartPie,
  TbReportAnalytics,
  TbEye,
  TbChartLine,
  TbTrendingUp,
  TbShieldCheck,
  TbRobot,
  TbBraces,
  TbServer,
  TbBrowser,
  TbDatabase,
  TbBug,
  TbShieldLock,
  TbCpu,
  TbSettings,
  TbBolt,
  TbBuildingFactory,
  TbGauge,
  TbSitemap,
  TbBuildingBridge,
  TbTool,
  TbBuildingArch,
  TbBuildingCommunity,
  TbRuler2,
  TbBackhoe,
  TbRulerMeasure,
  TbFlask,
  TbBulb,
  TbFlask2,
  TbDna,
  TbBinaryTree,
  TbReportMedical,
  TbHeartbeat,
  TbHeartHandshake,
  TbBabyCarriage,
  TbActivity,
  TbScan,
  TbPill,
  TbAmbulance,
  TbVaccine,
  TbBuildingHospital,
  TbShieldHeart,
  TbDental,
  TbMessages,
  TbBook,
  TbUsers,
  TbClick,
  TbScale,
  TbChalkboard,
  TbMoodKid,
  TbAccessible,
  TbDeviceLaptop,
  TbCertificate,
  TbUsersGroup,
  TbFileText,
  TbMicrophone,
  TbFingerprint,
  TbNotebook,
  TbBuildingSkyscraper,
  TbTruck,
  TbReportSearch,
  TbChecklist,
  TbTargetArrow,
  TbBusinessplan,
  TbReportMoney,
  TbChartCandle,
  TbPigMoney,
  TbArrowsExchange,
  TbCoins,
  TbShield,
  TbAdjustments,
  TbCalculator,
  TbPlant,
  TbCash,
  TbBuildingStore,
  TbChartArrows,
  TbFlag,
  TbChartArrowsVertical,
  TbMessage,
  TbSearch,
  TbHash,
  TbBox,
  TbBrush,
  TbMovie,
  TbDeviceDesktop,
  TbPlant2,
  TbRecycle,
  TbReload,
  TbClipboardCheck,
  TbCloud,
  TbGlobe,
  TbLanguage,
  TbBinoculars,
  TbSparkles,
  TbHeartRateMonitor,
  TbTestPipe,
  TbVirus,
  TbDeviceHeartMonitor,
  TbNurse,
  TbClipboardHeart,
  TbStretching,
  TbSos,
  TbDentalBroken,
  TbPrescription,
  TbFileCheck,
  TbMedicalCross,
  TbUserCog,
  TbBooks,
  TbCurrencyDollar,
  TbCreditCard,
  TbNews,
  TbLayoutGrid,
  TbTree,
  TbClipboardData,
  TbAtom,
  TbPointer,
  TbEngine,
  TbCrane,
  TbSofa,
  TbMap2,
  TbTelescope,
  TbRun,
  TbBallFootball,
  TbVideo,
  TbAd,
  TbDeviceTv,
  TbShirt,
  TbPencil,
  TbMountain,
  TbHistory,
  TbLock,
  TbDeviceGamepad,
  TbPlane,
  TbUsersPlus,
  TbPuzzle,
  TbCompass,
  TbUser,
  TbCar,
  TbShip,
  TbTrain,
  TbAnchor,
  TbDroplet,
  TbRouter,
  TbHeadset,
  TbShoppingCart,
  TbBread,
  TbMeat,
  TbGlass,
  TbConfetti,
  TbScissors,
  TbBarbell,
  TbHeadphones,
  TbSalad,
  TbMasksTheater,
  TbTrowel
} from 'react-icons/tb';

// Shared style for Tabler icons: a slightly thinner stroke than the default.
const tbProps = { size: 22, strokeWidth: 1.7 };

const iconProps = {
  size: 22,
  weight: 'duotone',
};

const richIconProps = {
  size: 22,
};

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '')
    .trim();

const STRENGTH_ICON_MAP = {
  communicatingclearly: <TbMessages {...tbProps} />,
  workingwellwithothers: <TbUsers {...tbProps} />,
  influencingandleadingothers: <TbFlag {...tbProps} />,
  understandingpeopleanduserneeds: <TbHeartHandshake {...tbProps} />,
  buildingrelationships: <TbUsersPlus {...tbProps} />,
  thinkinggloballyandacrosscultures: <TbWorld {...tbProps} />,
  planningandorganisingwork: <TbChecklist {...tbProps} />,
  takingownershipanddeliveringresults: <TbTargetArrow {...tbProps} />,
  showinginitiative: <TbRocket {...tbProps} />,
  stayingresilientunderpressure: <TbShield {...tbProps} />,
  learningquicklyandadaptingtochange: <TbReload {...tbProps} />,
  beingcuriousandresearchingeffectively: <TbSearch {...tbProps} />,
  analysinginformation: <TbChartHistogram {...tbProps} />,
  solvingproblems: <TbPuzzle {...tbProps} />,
  workingconfidentlywithnumbers: <TbCalculator {...tbProps} />,
  payingattentiontodetail: <TbEye {...tbProps} />,
  makingdecisionsandusingsoundjudgement: <TbScale {...tbProps} />,
  thinkingcreativelyandinnovating: <TbBulb {...tbProps} />,
  thinkingstrategicallyandseeingthebiggersystem: <TbSitemap {...tbProps} />,
  understandingthecommercialpicture: <TbChartLine {...tbProps} />,
  usingtoolsandsystemsconfidently: <TbTool {...tbProps} />,
};

const ENVIRONMENT_ICON_MAP = {
  structuredandprocessoriented: <TbChecklist {...tbProps} />,
  analyticalandresearchfocused: <TbSearch {...tbProps} />,
  precisionandqualitydriven: <TbTargetArrow {...tbProps} />,
  performancefocusedandresultsdriven: <TbTrendingUp {...tbProps} />,
  strategicandcommerciallyfocused: <TbChartLine {...tbProps} />,
  dynamicandfastpaced: <TbBolt {...tbProps} />,
  changeandtransformationfocused: <TbReload {...tbProps} />,
  flexibleandautonomous: <TbCompass {...tbProps} />,
  creativeanddesigndriven: <TbPalette {...tbProps} />,
  entrepreneurialandfastchanging: <TbRocket {...tbProps} />,
  handsonandpractical: <TbTool {...tbProps} />,
  collaborativeandteamoriented: <TbUsers {...tbProps} />,
  supportiveandpeoplecentred: <TbHeartHandshake {...tbProps} />,
  publicserviceandpolicyled: <TbBuildingCommunity {...tbProps} />,
  developmentfocusedandgrowthoriented: <TbChartArrowsVertical {...tbProps} />,
  independentandselfdirected: <TbUser {...tbProps} />,
  fieldbasedandexploratory: <TbBinoculars {...tbProps} />,
  purposedrivenandmissionled: <TbFlag {...tbProps} />,
};

const CAREER_WORLD_ICON_MAP = {
  dataanalyticsandquantitativeinsight: <TbChartHistogram {...tbProps} />,
  cwdataanalyticsquantitativeinsight: <TbChartHistogram {...tbProps} />,
  softwareaianddigitalsystems: <TbCode {...tbProps} />,
  cwsoftwareaidigitalsystems: <TbCode {...tbProps} />,
  engineeringmanufacturingandinfrastructure: <TbTools {...tbProps} />,
  cwengineeringmanufacturinginfrastructure: <TbTools {...tbProps} />,
  architecturebuiltenvironmentandspatialdesign: <TbBuilding {...tbProps} />,
  cwarchitecturebuiltenvironmentspatialdesign: <TbBuilding {...tbProps} />,
  scientificdiscoveryandinnovation: <TbMicroscope {...tbProps} />,
  scienceresearchandlaboratoryinnovation: <TbMicroscope {...tbProps} />,
  cwscienceresearchlaboratoryinnovation: <TbMicroscope {...tbProps} />,
  healthcareandclinicalpractice: <TbStethoscope {...tbProps} />,
  healthcareclinicalpractice: <TbStethoscope {...tbProps} />,
  cwhealthcareclinicalpractice: <TbStethoscope {...tbProps} />,
  psychologybehaviourandhumaninsight: <TbBrain {...tbProps} />,
  psychologybehaviourandhumandevelopment: <TbBrain {...tbProps} />,
  cwpsychologybehaviourhumaninsight: <TbBrain {...tbProps} />,
  cwpsychologybehaviourhumandevelopment: <TbBrain {...tbProps} />,
  educationcoachingandpeopledevelopment: <TbSchool {...tbProps} />,
  educationcoachingandlearningdevelopment: <TbSchool {...tbProps} />,
  cweducationcoachingpeopledevelopment: <TbSchool {...tbProps} />,
  lawgovernanceandpublicimpact: <TbGavel {...tbProps} />,
  cwlawgovernancepublicimpact: <TbGavel {...tbProps} />,
  businessstrategycommercialandleadership: <TbBriefcase {...tbProps} />,
  businessmanagementandcommercialstrategy: <TbBriefcase {...tbProps} />,
  cwbusinessstrategycommercialleadership: <TbBriefcase {...tbProps} />,
  cwbusinessmanagementcommercialstrategy: <TbBriefcase {...tbProps} />,
  financeeconomicsandinvestment: <TbBuildingBank {...tbProps} />,
  cwfinanceeconomicsinvestment: <TbBuildingBank {...tbProps} />,
  entrepreneurshipinnovationandventurebuilding: <TbRocket {...tbProps} />,
  entrepreneurshipandinnovation: <TbRocket {...tbProps} />,
  cwentrepreneurshipinnovationventurebuilding: <TbRocket {...tbProps} />,
  marketingmediaandcommunication: <TbSpeakerphone {...tbProps} />,
  marketingcommunicationsandmedia: <TbSpeakerphone {...tbProps} />,
  cwmarketingmediacommunication: <TbSpeakerphone {...tbProps} />,
  cwmarketingcommunicationsmedia: <TbSpeakerphone {...tbProps} />,
  creativeartsdesignandexperience: <TbPalette {...tbProps} />,
  creativedesignandexperience: <TbPalette {...tbProps} />,
  cwcreativeartsdesignexperience: <TbPalette {...tbProps} />,
  cwcreativedesignexperience: <TbPalette {...tbProps} />,
  environmentsustainabilityandplanetaryfutures: <TbLeaf {...tbProps} />,
  cwenvironmentsustainabilityplanetaryfutures: <TbLeaf {...tbProps} />,
  societyculturelanguagesandglobalaffairs: <TbWorld {...tbProps} />,
  cwsocietyculturelanguagesglobalaffairs: <TbWorld {...tbProps} />,
  languagesculturesandglobalaffairs: <TbWorld {...tbProps} />,
  societycultureandlanguages: <TbWorld {...tbProps} />,
  // Vocational ("Explore other career worlds") worlds.
  skilledtradesandconstruction: <TbHammer {...tbProps} />,
  vocskilledtrades: <TbHammer {...tbProps} />,
  makingcraftandrepair: <TbNeedleThread {...tbProps} />,
  vocmakingcraft: <TbNeedleThread {...tbProps} />,
  landanimalsandtheoutdoors: <TbPlant2 {...tbProps} />,
  voclandanimals: <TbPlant2 {...tbProps} />,
  protectiveandemergencyservices: <TbShield {...tbProps} />,
  vocprotective: <TbShield {...tbProps} />,
  transportaviationandmaritime: <TbPlane {...tbProps} />,
  voctransport: <TbPlane {...tbProps} />,
  hospitalityfoodandevents: <TbChefHat {...tbProps} />,
  vochospitality: <TbChefHat {...tbProps} />,
  careandcommunitysupport: <TbHeartHandshake {...tbProps} />,
  voccarecommunity: <TbHeartHandshake {...tbProps} />,
};

const PATHWAY_ICON_MAP = {
  academicmedicineandclinicalresearch: <TbMicroscope {...tbProps} />,
  acuteemergencyandcriticalcare: <TbHeartRateMonitor {...tbProps} />,
  clinicalmedicinedoctor: <TbStethoscope {...tbProps} />,
  clinicalpharmacy: <TbPill {...tbProps} />,
  clinicalresearchnursing: <TbClipboardHeart {...tbProps} />,
  clinicalscienceandlaboratorydiagnostics: <TbTestPipe {...tbProps} />,
  communitypharmacy: <TbPrescription {...tbProps} />,
  dentalnursingandoralhealth: <TbDental {...tbProps} />,
  dentalresearchandacademicdentistry: <TbDentalBroken {...tbProps} />,
  dentistrydentist: <TbAccessible {...tbProps} />,
  diagnosticandinvestigativemedicine: <TbReportMedical {...tbProps} />,
  diagnosticsimagingandclinicalsupport: <TbScan {...tbProps} />,
  dieteticsandnutrition: <TbSalad {...tbProps} />,
  digitalhealthhealthtechandmedicalinnovation: <TbDeviceHeartMonitor {...tbProps} />,
  healthcaremanagementandserviceimprovement: <TbBuildingHospital {...tbProps} />,
  medicinespolicyandpublichealthpharmacy: <TbVaccine {...tbProps} />,
  mentalhealthandbehaviouralmedicine: <TbBrain {...tbProps} />,
  midwifery: <TbBabyCarriage {...tbProps} />,
  nurseeducationandleadership: <TbCertificate {...tbProps} />,
  nursing: <TbNurse {...tbProps} />,
  opticalandeyecare: <TbEye {...tbProps} />,
  oralhealthpolicyanddentalpublichealth: <TbShieldHeart {...tbProps} />,
  paramedicpracticeandemergencycare: <TbAmbulance {...tbProps} />,
  perioperativeandsurgicalcare: <TbMedicalCross {...tbProps} />,
  podiatryandfoothealth: <TbActivity {...tbProps} />,
  publichealthandhealthimprovement: <TbHeartbeat {...tbProps} />,
  publichealthmedicineepidemiologyandhealthpolicy: <TbVirus {...tbProps} />,
  publichealthnursingandhealthvisiting: <TbHeartHandshake {...tbProps} />,
  rehabilitationandfunctionalindependence: <TbStretching {...tbProps} />,
  specialistdentistry: <TbAd {...tbProps} />,
  surgeryandproceduralmedicine: <TbAdjustments {...tbProps} />,
  adultcarework: <TbHeartHandshake {...tbProps} />,
  childrenyoungpeopleandfamilies: <TbMoodKid {...tbProps} />,
  faithandcommunityleadership: <TbBuildingCommunity {...tbProps} />,
  funeralandbereavementservices: <TbUmbrella {...tbProps} />,
  socialworkandsafeguarding: <TbShieldHeart {...tbProps} />,
  biomedicalandclinicalresearch: <TbDna {...tbProps} />,
  clinicaltrialsandtranslationalresearch: <TbReportMedical {...tbProps} />,
  forensicscience: <TbFingerprint {...tbProps} />,
  laboratoryscience: <TbFlask {...tbProps} />,
  materialsandchemicalanalysis: <TbAtom {...tbProps} />,
  pharmaceuticalindustryanddrugdevelopment: <TbPill {...tbProps} />,
  randdscience: <TbTelescope {...tbProps} />,
  regulatoryaffairsandmedicinessafety: <TbClipboardCheck {...tbProps} />,
  scientificdataandbioinformatics: <TbBinaryTree {...tbProps} />,
  aiandmachinelearning: <TbRobot {...tbProps} />,
  backendandplatformengineering: <TbServer {...tbProps} />,
  businessintelligenceandreporting: <TbReportAnalytics {...tbProps} />,
  coredataanalysisandbusinessinsight: <TbChartHistogram {...tbProps} />,
  customerandmarketinsight: <TbChartPie {...tbProps} />,
  cybersecurity: <TbShieldLock {...tbProps} />,
  dataengineering: <TbDatabase {...tbProps} />,
  datascienceandadvancedmodelling: <TbChartDots {...tbProps} />,
  digitalproductandux: <TbClick {...tbProps} />,
  frontendandwebdevelopment: <TbBrowser {...tbProps} />,
  gamedesignanddevelopment: <TbDeviceGamepad {...tbProps} />,
  itsupportandnetworks: <TbAccessible {...tbProps} />,
  productgrowthandexperimentationanalytics: <TbChartArrowsVertical {...tbProps} />,
  qualityassuranceandtestengineering: <TbBug {...tbProps} />,
  softwareengineering: <TbCode {...tbProps} />,
  uxresearchandbehaviouralinsight: <TbPointer {...tbProps} />,
  uxuidesign: <TbLayoutGrid {...tbProps} />,
  aerospaceanddefenceengineering: <TbPlane {...tbProps} />,
  chemicalandprocessengineering: <TbFlask2 {...tbProps} />,
  civilandstructuralengineering: <TbBuildingBridge {...tbProps} />,
  electricalandelectronicengineering: <TbBolt {...tbProps} />,
  infrastructuremaintenanceandassetengineering: <TbTools {...tbProps} />,
  manufacturingandprocesstechnology: <TbBuildingFactory {...tbProps} />,
  manufacturingandproductionengineering: <TbEngine {...tbProps} />,
  mechanicaldesignanddevelopmentengineering: <TbSettings {...tbProps} />,
  motorvehicleandbodywork: <TbCar {...tbProps} />,
  roboticsandautomationengineering: <TbRobot {...tbProps} />,
  systemsengineering: <TbSitemap {...tbProps} />,
  architecturaltechnologyandbim: <TbRuler2 {...tbProps} />,
  architecture: <TbBuildingArch {...tbProps} />,
  bricklayingcarpentryandfinishingtrades: <TbTrowel {...tbProps} />,
  civilengineeringtechnicians: <TbBuildingBridge {...tbProps} />,
  constructionprojectdelivery: <TbCrane {...tbProps} />,
  electricalinstallationandbuildingservices: <TbBolt {...tbProps} />,
  facilitiesandpropertymanagement: <TbBuilding {...tbProps} />,
  fireandbuildingsafety: <TbShield {...tbProps} />,
  groundworkssteelandfabrication: <TbBackhoe {...tbProps} />,
  plumbingheatingandgas: <TbTool {...tbProps} />,
  propertydevelopmentandassetmanagement: <TbBuildingSkyscraper {...tbProps} />,
  surveyinggeospatialandland: <TbMap2 {...tbProps} />,
  surveyingvaluationandcostconsultancy: <TbRulerMeasure {...tbProps} />,
  sustainabilityandbuildingperformance: <TbGauge {...tbProps} />,
  telecomsandnetworkinfrastructure: <TbRouter {...tbProps} />,
  townplanningandurbandevelopment: <TbBuildingCommunity {...tbProps} />,
  businessadministrationandofficesupport: <TbClipboardCheck {...tbProps} />,
  hrandrecruitmentsupport: <TbUsersPlus {...tbProps} />,
  informationandknowledgemanagement: <TbBooks {...tbProps} />,
  businessanalysis: <TbReportSearch {...tbProps} />,
  businessdevelopmentandcommercialpartnerships: <TbBusinessplan {...tbProps} />,
  consultingandstrategicimprovement: <TbChartArrows {...tbProps} />,
  generalistbusinessprogrammes: <TbBriefcase {...tbProps} />,
  governancecomplianceandquality: <TbChecklist {...tbProps} />,
  hrpeopleandorganisations: <TbUsers {...tbProps} />,
  leadershipandmanagement: <TbUserCog {...tbProps} />,
  operationsandsupplychain: <TbTruck {...tbProps} />,
  peopleanalyticsandworkplacebehaviour: <TbChartDots {...tbProps} />,
  projectpmoandtransformation: <TbSitemap {...tbProps} />,
  buyingmerchandisingandsales: <TbBox {...tbProps} />,
  customerserviceandclientdelivery: <TbHeadset {...tbProps} />,
  realestateagencyandbrokerage: <TbBuildingStore {...tbProps} />,
  retailandshopwork: <TbShoppingCart {...tbProps} />,
  brandandmarketingstrategy: <TbTargetArrow {...tbProps} />,
  contentandsocialmedia: <TbHash {...tbProps} />,
  filmtvandmediaproduction: <TbVideo {...tbProps} />,
  journalismpublishingandeditorial: <TbNews {...tbProps} />,
  marketresearchandaudienceinsight: <TbChartPie {...tbProps} />,
  performancemarketingandgrowth: <TbTrendingUp {...tbProps} />,
  prandcommunications: <TbMessages {...tbProps} />,
  accountingauditandassurance: <TbCalculator {...tbProps} />,
  assetandwealthmanagement: <TbPigMoney {...tbProps} />,
  bankingoperationsandmiddleoffice: <TbBuildingBank {...tbProps} />,
  commercialandcorporatebanking: <TbAccessible {...tbProps} />,
  economics: <TbChartLine {...tbProps} />,
  equityresearchandinvestmentresearch: <TbReportSearch {...tbProps} />,
  financialanalysisandfpanda: <TbReportMoney {...tbProps} />,
  fintechanddigitalfinance: <TbCreditCard {...tbProps} />,
  insuranceandactuarial: <TbUmbrella {...tbProps} />,
  investmentbankingandcorporatefinance: <TbCash {...tbProps} />,
  marketsandtrading: <TbChartCandle {...tbProps} />,
  privateequityandventurecapital: <TbCoins {...tbProps} />,
  realestateinvestmentandfinance: <TbBuildingSkyscraper {...tbProps} />,
  riskandquantitativeanalysis: <TbMathSymbols {...tbProps} />,
  riskcomplianceandcontrols: <TbChecklist {...tbProps} />,
  sustainablefinanceandimpactinvesting: <TbLeaf {...tbProps} />,
  treasuryandliquidity: <TbCoin {...tbProps} />,
  barristerandadvocacy: <TbGavel {...tbProps} />,
  governanceriskandcompliance: <TbShieldCheck {...tbProps} />,
  intelligencepublicserviceandsecurityanalysis: <TbBinoculars {...tbProps} />,
  investigationsandfinancialcrime: <TbFingerprint {...tbProps} />,
  justicerehabilitationandbehaviourchange: <TbScale {...tbProps} />,
  legalsupportandparalegalwork: <TbFileCheck {...tbProps} />,
  policyandpublicsectoranalysis: <TbFileText {...tbProps} />,
  publicaffairsandadvocacy: <TbSpeakerphone {...tbProps} />,
  publicserviceandpolicydelivery: <TbAccessible {...tbProps} />,
  solicitorpractice: <TbActivity {...tbProps} />,
  armedforcesarmyroyalnavyraf: <TbFlag {...tbProps} />,
  communitysafetyandjustice: <TbShield {...tbProps} />,
  emergencyplanningandambulanceserviceleadership: <TbAmbulance {...tbProps} />,
  fireandrescue: <TbSos {...tbProps} />,
  police: <TbShieldLock {...tbProps} />,
  prisonsandcustodialservices: <TbLock {...tbProps} />,
  securityfraudandresilience: <TbShieldCheck {...tbProps} />,
  animationandmotiondesign: <TbMovie {...tbProps} />,
  designandillustration: <TbPencil {...tbProps} />,
  digitaldesignandmultimedia: <TbDeviceTv {...tbProps} />,
  fashionandtextiles: <TbNeedleThread {...tbProps} />,
  finecraftandmaking: <TbHammer {...tbProps} />,
  furnituremakingandrestoration: <TbSofa {...tbProps} />,
  graphicdesignandvisualcommunication: <TbPalette {...tbProps} />,
  photography: <TbScan {...tbProps} />,
  productandindustrialdesign: <TbBulb {...tbProps} />,
  earlyyearsandfamilysupport: <TbBabyCarriage {...tbProps} />,
  educationsupportoutreachandstudentservices: <TbUsersGroup {...tbProps} />,
  highereducationandacademicresearch: <TbSchool {...tbProps} />,
  learningdesignandeducationaltechnology: <TbDeviceLaptop {...tbProps} />,
  primaryteachingandclassroompractice: <TbChalkboard {...tbProps} />,
  secondaryteaching: <TbBook {...tbProps} />,
  sendandinclusionsupport: <TbAccessible {...tbProps} />,
  teachingassistantandlearningsupport: <TbNotebook {...tbProps} />,
  traininglearninganddevelopment: <TbCertificate {...tbProps} />,
  youthandcommunitywork: <TbUsersPlus {...tbProps} />,
  agricultureforestryandlandmanagement: <TbPlant2 {...tbProps} />,
  animalcareandveterinarysupport: <TbHeartHandshake {...tbProps} />,
  farmingandcropproduction: <TbPlant {...tbProps} />,
  forestryandarboriculture: <TbTree {...tbProps} />,
  horticulturelandscapingandturf: <TbLeaf {...tbProps} />,
  veterinaryandanimalscience: <TbStethoscope {...tbProps} />,
  veterinarynursing: <TbNurse {...tbProps} />,
  circulareconomyandsustainablesupplychains: <TbRecycle {...tbProps} />,
  conservationandlandmanagement: <TbTree {...tbProps} />,
  environmentandwatermanagement: <TbDroplet {...tbProps} />,
  environmentalpolicyandimpactassessment: <TbFileText {...tbProps} />,
  environmentalscienceandmonitoring: <TbFlask {...tbProps} />,
  netzeroclimateandsustainabilitystrategy: <TbLeaf {...tbProps} />,
  sustainabilityandesgadvisory: <TbPlant2 {...tbProps} />,
  airtrafficcontrol: <TbAccessible {...tbProps} />,
  airlinepilot: <TbPlane {...tbProps} />,
  aviationoperations: <TbActivity {...tbProps} />,
  logisticsandsupplychain: <TbTruck {...tbProps} />,
  maritimeoperations: <TbAnchor {...tbProps} />,
  merchantnavyandmaritimeofficer: <TbShip {...tbProps} />,
  railandpassengertransportoperations: <TbTrain {...tbProps} />,
  railandtraindriving: <TbAd {...tbProps} />,
  travelandtourism: <TbMap2 {...tbProps} />,
  warehousingandlogisticsoperations: <TbBox {...tbProps} />,
  bakingandfoodproduction: <TbBread {...tbProps} />,
  butcheryandfishmongery: <TbMeat {...tbProps} />,
  eventsandexperiencemanagement: <TbConfetti {...tbProps} />,
  foodandbeverageoperations: <TbGlass {...tbProps} />,
  hospitalityandhotelmanagement: <TbBuildingStore {...tbProps} />,
  professionalchefandculinaryarts: <TbChefHat {...tbProps} />,
  aestheticsandholistictherapy: <TbSparkles {...tbProps} />,
  beautytherapyandnails: <TbBrush {...tbProps} />,
  hairdressingandbarbering: <TbScissors {...tbProps} />,
  leisureandfacilitiesmanagement: <TbBuildingStore {...tbProps} />,
  personaltrainingandfitness: <TbBarbell {...tbProps} />,
  sportandexercisescience: <TbActivity {...tbProps} />,
  sportfitnessandoutdoorinstruction: <TbMountain {...tbProps} />,
  sportscoaching: <TbBallFootball {...tbProps} />,
  clinicalpsychologyandmentalhealthsupport: <TbBrain {...tbProps} />,
  counsellingpsychotherapyandtherapeuticpractice: <TbMessage {...tbProps} />,
  occupationalandorganisationalpsychology: <TbUsers {...tbProps} />,
  heritagemuseumsandarchives: <TbBuildingArch {...tbProps} />,
  internationaldevelopmentandngoprogrammes: <TbWorld {...tbProps} />,
  internationalrelationspolicyandgeopoliticalanalysis: <TbGlobe {...tbProps} />,
  languagestranslationandlocalisation: <TbLanguage {...tbProps} />,
  socialresearchandculturalanalysis: <TbUsersGroup {...tbProps} />,
  actingandperformance: <TbMasksTheater {...tbProps} />,
  danceandchoreography: <TbStretching {...tbProps} />,
  musicperformanceandproduction: <TbMicrophone {...tbProps} />,
  soundandaudioproduction: <TbHeadphones {...tbProps} />,
  theatreandstageproduction: <TbBulb {...tbProps} />,
  productgrowthandbusinessdevelopmentinstartups: <TbTrendingUp {...tbProps} />,
  startupoperations: <TbAdjustments {...tbProps} />,
  venturebuildingandfounder: <TbRocket {...tbProps} />,
  venturecapitalacceleratorsandinnovationsupport: <TbCoins {...tbProps} />,
};

function fallbackIcon(title = '') {
  const key = norm(title);
  if (key.includes('data') || key.includes('analytics') || key.includes('reporting')) return <TbChartHistogram {...tbProps} />;
  if (key.includes('software') || key.includes('digital') || key.includes('web') || key.includes('ai')) return <TbCode {...tbProps} />;
  if (key.includes('finance') || key.includes('bank') || key.includes('investment') || key.includes('trading')) return <TbBuildingBank {...tbProps} />;
  if (key.includes('health') || key.includes('clinical') || key.includes('medicine') || key.includes('nursing')) return <TbStethoscope {...tbProps} />;
  if (key.includes('education') || key.includes('teaching') || key.includes('learning')) return <TbSchool {...tbProps} />;
  if (key.includes('law') || key.includes('legal') || key.includes('policy') || key.includes('governance')) return <TbGavel {...tbProps} />;
  if (key.includes('marketing') || key.includes('media') || key.includes('communication')) return <TbSpeakerphone {...tbProps} />;
  if (key.includes('design') || key.includes('creative') || key.includes('animation')) return <TbPalette {...tbProps} />;
  if (key.includes('environment') || key.includes('sustainability') || key.includes('climate')) return <TbLeaf {...tbProps} />;
  if (key.includes('people') || key.includes('team') || key.includes('support')) return <TbUsers {...tbProps} />;
  if (key.includes('strategy') || key.includes('commercial') || key.includes('business')) return <TbBriefcase {...tbProps} />;
  if (key.includes('research') || key.includes('analysis') || key.includes('insight')) return <TbSearch {...tbProps} />;
  return <TbSparkles {...tbProps} />;
}

export function getStrengthIcon(title = '') {
  return STRENGTH_ICON_MAP[norm(title)] || fallbackIcon(title);
}

export function getEnvironmentIcon(title = '') {
  return ENVIRONMENT_ICON_MAP[norm(title)] || fallbackIcon(title);
}

export function getCareerWorldIcon(title = '') {
  return CAREER_WORLD_ICON_MAP[norm(title)] || fallbackIcon(title);
}

export function getPathwayIcon(title = '') {
  return PATHWAY_ICON_MAP[norm(title)] || fallbackIcon(title);
}

// A distinct, relevant icon for every degree, so no two degrees within a
// career world share one. Keyed by normalised title.
const SUBJECT_ICON_MAP = {
  // Data, Analytics & Quantitative Insight
  mathematics: <TbMathSymbols {...tbProps} />,
  statistics: <TbChartDots {...tbProps} />,
  mathematicsandstatistics: <TbInfinity {...tbProps} />,
  datascience: <TbChartBar {...tbProps} />,
  actuarialscience: <TbUmbrella {...tbProps} />,
  operationalresearch: <TbRoute {...tbProps} />,
  financialmathematics: <TbCoin {...tbProps} />,
  // Software, AI & Digital Systems
  computerscienceandartificialintelligence: <TbRobot {...tbProps} />,
  softwareengineering: <TbCode {...tbProps} />,
  computersciencewithcybersecurity: <TbLock {...tbProps} />,
  artificialintelligence: <TbCpu {...tbProps} />,
  computerscience: <TbBraces {...tbProps} />,
  cybersecurity: <TbShieldLock {...tbProps} />,
  gamestechnology: <TbDeviceGamepad {...tbProps} />,
  humancomputerinteraction: <TbPointer {...tbProps} />,
  // Engineering, Manufacturing & Infrastructure
  mechanicalengineering: <TbEngine {...tbProps} />,
  civilengineering: <TbBuildingBridge {...tbProps} />,
  electricalandelectronicengineering: <TbBolt {...tbProps} />,
  chemicalengineering: <TbFlask {...tbProps} />,
  aeronauticalandaerospaceengineering: <TbPlane {...tbProps} />,
  manufacturingengineering: <TbBuildingFactory {...tbProps} />,
  roboticsandmechatronicengineering: <TbRobot {...tbProps} />,
  biomedicalengineering: <TbHeartbeat {...tbProps} />,
  systemsengineering: <TbSitemap {...tbProps} />,
  // Architecture, Built Environment & Spatial Design
  architecture: <TbBuildingArch {...tbProps} />,
  architectureandurbanplanning: <TbBuildingCommunity {...tbProps} />,
  architecturaltechnology: <TbRuler2 {...tbProps} />,
  constructionmanagement: <TbCrane {...tbProps} />,
  interiorarchitectureanddesign: <TbSofa {...tbProps} />,
  landscapearchitecture: <TbTree {...tbProps} />,
  urbanplanninganddevelopment: <TbMap2 {...tbProps} />,
  // Scientific Discovery & Innovation
  biomedicalscience: <TbMicroscope {...tbProps} />,
  biochemistry: <TbFlask2 {...tbProps} />,
  chemistry: <TbFlask {...tbProps} />,
  biology: <TbDna {...tbProps} />,
  physics: <TbAtom {...tbProps} />,
  neuroscience: <TbBrain {...tbProps} />,
  biotechnology: <TbTestPipe {...tbProps} />,
  naturalsciences: <TbTelescope {...tbProps} />,
  pharmacology: <TbPill {...tbProps} />,
  // Health Care & Clinical Practice
  medicine: <TbStethoscope {...tbProps} />,
  dentistry: <TbDental {...tbProps} />,
  pharmacy: <TbPill {...tbProps} />,
  nursing: <TbNurse {...tbProps} />,
  midwifery: <TbBabyCarriage {...tbProps} />,
  physiotherapy: <TbStretching {...tbProps} />,
  occupationaltherapy: <TbActivity {...tbProps} />,
  paramedicscience: <TbAmbulance {...tbProps} />,
  socialwork: <TbHeartHandshake {...tbProps} />,
  sportandexercisescience: <TbRun {...tbProps} />,
  diagnosticradiography: <TbScan {...tbProps} />,
  optometry: <TbEye {...tbProps} />,
  // Psychology, Behaviour & Human Insight
  psychology: <TbBrain {...tbProps} />,
  counsellingandpsychotherapy: <TbMessages {...tbProps} />,
  cognitivescience: <TbBulb {...tbProps} />,
  forensicpsychology: <TbFingerprint {...tbProps} />,
  behaviouralscience: <TbChartHistogram {...tbProps} />,
  psychologywithneuroscience: <TbActivity {...tbProps} />,
  // Education, Coaching & People Development
  educationstudies: <TbBook {...tbProps} />,
  primaryeducationqts: <TbChalkboard {...tbProps} />,
  earlyyearseducationandcare: <TbMoodKid {...tbProps} />,
  secondaryeducationqts: <TbBooks {...tbProps} />,
  sportscoachinganddevelopment: <TbBallFootball {...tbProps} />,
  // Law, Governance & Public Impact
  law: <TbGavel {...tbProps} />,
  politics: <TbFlag {...tbProps} />,
  socialandpublicpolicy: <TbFileText {...tbProps} />,
  criminology: <TbFingerprint {...tbProps} />,
  philosophypoliticsandeconomicsppe: <TbScale {...tbProps} />,
  lawwithcriminology: <TbShield {...tbProps} />,
  // Business Strategy, Commercial & Leadership
  businessmanagement: <TbBriefcase {...tbProps} />,
  businessanalytics: <TbChartPie {...tbProps} />,
  internationalbusiness: <TbGlobe {...tbProps} />,
  humanresourcemanagement: <TbUsersGroup {...tbProps} />,
  operationsandsupplychainmanagement: <TbTruck {...tbProps} />,
  // Finance, Economics & Investment
  accounting: <TbCalculator {...tbProps} />,
  finance: <TbCoins {...tbProps} />,
  accountingandfinance: <TbReportMoney {...tbProps} />,
  economics: <TbChartLine {...tbProps} />,
  financeandfinancialtechnology: <TbCreditCard {...tbProps} />,
  economicswithdatascience: <TbChartDots {...tbProps} />,
  investmentmanagement: <TbPigMoney {...tbProps} />,
  // Entrepreneurship, Innovation & Venture Building
  entrepreneurshipandinnovation: <TbRocket {...tbProps} />,
  businessmanagementwithentrepreneurship: <TbBulb {...tbProps} />,
  socialenterpriseandcommunitydevelopment: <TbHeartHandshake {...tbProps} />,
  innovationandtechnologymanagement: <TbCpu {...tbProps} />,
  // Marketing, Media & Communication
  marketing: <TbSpeakerphone {...tbProps} />,
  publicrelationsandcommunications: <TbMessage {...tbProps} />,
  digitalmediaproductionandtechnology: <TbVideo {...tbProps} />,
  digitalmarketingandsocialmedia: <TbHash {...tbProps} />,
  journalism: <TbNews {...tbProps} />,
  advertisingandbrandmanagement: <TbAd {...tbProps} />,
  mediastudies: <TbDeviceTv {...tbProps} />,
  // Creative Arts, Design & Experience
  productdesign: <TbBox {...tbProps} />,
  graphicdesign: <TbBrush {...tbProps} />,
  animation: <TbMovie {...tbProps} />,
  uxdesignandinteractiondesign: <TbLayoutGrid {...tbProps} />,
  gamedesign: <TbDeviceGamepad {...tbProps} />,
  fashiondesign: <TbShirt {...tbProps} />,
  fineart: <TbPalette {...tbProps} />,
  filmandtelevisionproduction: <TbVideo {...tbProps} />,
  illustration: <TbPencil {...tbProps} />,
  // Land / animal, property, hospitality, heritage degrees (were hitting fallback)
  veterinarymedicine: <TbStethoscope {...tbProps} />,
  realestateandproperty: <TbBuildingSkyscraper {...tbProps} />,
  hospitalitytourismandeventsmanagement: <TbBuilding {...tbProps} />,
  heritageandmuseumstudies: <TbBuildingBank {...tbProps} />,
  // Performing Arts & Music degrees
  music: <TbMicrophone {...tbProps} />,
  musictechnology: <TbHeadphones {...tbProps} />,
  dramaandtheatrestudies: <TbMasksTheater {...tbProps} />,
  dance: <TbStretching {...tbProps} />,
  musicaltheatre: <TbSpeakerphone {...tbProps} />,
  technicaltheatreandstagemanagement: <TbBulb {...tbProps} />,
  // Environment, Sustainability & Planetary Futures
  geography: <TbMountain {...tbProps} />,
  environmentalscience: <TbPlant2 {...tbProps} />,
  environmentalmanagement: <TbRecycle {...tbProps} />,
  ecologyandconservationbiology: <TbTree {...tbProps} />,
  climatescienceandsustainability: <TbCloud {...tbProps} />,
  sustainabledevelopment: <TbLeaf {...tbProps} />,
  // Society, Culture, Languages & Global Affairs
  modernlanguages: <TbLanguage {...tbProps} />,
  sociology: <TbUsers {...tbProps} />,
  anthropology: <TbUsersGroup {...tbProps} />,
  internationalrelations: <TbWorld {...tbProps} />,
  history: <TbHistory {...tbProps} />,
  philosophy: <TbBook {...tbProps} />,
  globaldevelopmentstudies: <TbHeartHandshake {...tbProps} />,
};

// Degree icons: exact per-degree map first, keyword rules as a safety net.
export function getSubjectIcon(title = '') {
  const mapped = SUBJECT_ICON_MAP[norm(title)];
  if (mapped) return mapped;
  const k = norm(title);
  const has = (...words) => words.some((w) => k.includes(norm(w)));

  // Health & clinical
  if (has('medicine')) return <FaUserMd {...richIconProps} />;
  if (has('dentistry')) return <FaTooth {...richIconProps} />;
  if (has('pharmacy')) return <FaPills {...richIconProps} />;
  if (has('pharmacology')) return <FaPills {...richIconProps} />;
  if (has('nursing')) return <FaUserNurse {...richIconProps} />;
  if (has('midwifery')) return <FaBaby {...richIconProps} />;
  if (has('paramedic')) return <FaAmbulance {...richIconProps} />;
  if (has('radiography')) return <FaXRay {...richIconProps} />;
  if (has('optometry')) return <FaEye {...richIconProps} />;
  if (has('physiotherapy', 'occupational therapy')) return <FaHandsHelping {...richIconProps} />;
  if (has('sport')) return <FaRunning {...richIconProps} />;
  if (has('social work')) return <FaHandsHelping {...richIconProps} />;

  // Psychology & mind
  if (has('neuroscience')) return <FaBrain {...richIconProps} />;
  if (has('psychology', 'counselling', 'psychotherapy', 'cognitive', 'behavioural')) return <FaBrain {...richIconProps} />;

  // Life & physical sciences
  if (has('biochemistry')) return <FaDna {...richIconProps} />;
  if (has('biotechnology')) return <FaDna {...richIconProps} />;
  if (has('biomedical engineering')) return <FaHeartbeat {...richIconProps} />;
  if (has('biomedical', 'biology', 'ecology', 'conservation')) return <FaDna {...richIconProps} />;
  if (has('chemistry')) return <FaFlask {...richIconProps} />;
  if (has('physics')) return <FaAtom {...richIconProps} />;
  if (has('natural sciences')) return <FaMicroscope {...richIconProps} />;

  // Engineering (specific first)
  if (has('aeronautical', 'aerospace')) return <FaPlane {...richIconProps} />;
  if (has('civil')) return <FaHardHat {...richIconProps} />;
  if (has('electrical', 'electronic')) return <FaBolt {...richIconProps} />;
  if (has('chemical engineering')) return <FaFlask {...richIconProps} />;
  if (has('robotics', 'mechatronic')) return <FaRobot {...richIconProps} />;
  if (has('manufacturing', 'systems engineering', 'mechanical', 'engineering')) return <FaCogs {...richIconProps} />;

  // Built environment
  if (has('construction')) return <FaHardHat {...richIconProps} />;
  if (has('urban', 'planning')) return <FaCity {...richIconProps} />;
  if (has('landscape')) return <FaTree {...richIconProps} />;
  if (has('architecture', 'interior', 'built')) return <FaDraftingCompass {...richIconProps} />;

  // Computing & data
  if (has('cyber')) return <FaShieldAlt {...richIconProps} />;
  if (has('artificial intelligence')) return <FaRobot {...richIconProps} />;
  if (has('games technology', 'game design', 'games')) return <FaGamepad {...richIconProps} />;
  if (has('computer', 'software', 'human-computer', 'human computer')) return <FaLaptopCode {...richIconProps} />;
  if (has('data science')) return <FaChartBar {...richIconProps} />;
  if (has('statistics', 'mathematics', 'actuarial', 'operational research', 'financial mathematics')) return <FaCalculator {...richIconProps} />;

  // Law, politics, society
  if (has('criminology')) return <FaFingerprint {...richIconProps} />;
  if (has('law')) return <FaGavel {...richIconProps} />;
  if (has('international relations')) return <FaGlobeEurope {...richIconProps} />;
  if (has('politics', 'ppe', 'public policy', 'social and public')) return <FaLandmark {...richIconProps} />;
  if (has('global development')) return <FaGlobeAfrica {...richIconProps} />;
  if (has('sociology', 'anthropology')) return <FaUsers {...richIconProps} />;
  if (has('history')) return <FaLandmark {...richIconProps} />;
  if (has('philosophy')) return <FaBookOpen {...richIconProps} />;
  if (has('modern languages', 'languages')) return <FaLanguage {...richIconProps} />;

  // Finance, economics, business
  if (has('accounting')) return <FaCalculator {...richIconProps} />;
  if (has('economics')) return <FaChartLine {...richIconProps} />;
  if (has('finance', 'investment', 'banking')) return <FaCoins {...richIconProps} />;
  if (has('supply chain', 'operations')) return <FaTruck {...richIconProps} />;
  if (has('human resource')) return <FaUsers {...richIconProps} />;
  if (has('business analytics')) return <FaChartBar {...richIconProps} />;
  if (has('entrepreneur', 'innovation', 'venture', 'enterprise')) return <FaRocket {...richIconProps} />;
  if (has('business', 'management', 'international business')) return <FaBriefcase {...richIconProps} />;

  // Marketing, media, creative
  if (has('journalism')) return <FaNewspaper {...richIconProps} />;
  if (has('digital marketing', 'social media')) return <FaHashtag {...richIconProps} />;
  if (has('advertising', 'marketing', 'public relations', 'communications')) return <FaBullhorn {...richIconProps} />;
  if (has('media')) return <FaFilm {...richIconProps} />;
  if (has('animation', 'film', 'television')) return <FaFilm {...richIconProps} />;
  if (has('fashion')) return <FaTshirt {...richIconProps} />;
  if (has('fine art')) return <FaPaintBrush {...richIconProps} />;
  if (has('illustration')) return <FaPenNib {...richIconProps} />;
  if (has('ux', 'interaction design')) return <FaObjectGroup {...richIconProps} />;
  if (has('graphic', 'product design', 'design')) return <FaPalette {...richIconProps} />;

  // Environment & education
  if (has('climate')) return <FaCloudSun {...richIconProps} />;
  if (has('geography')) return <FaMountain {...richIconProps} />;
  if (has('environment', 'sustainab')) return <FaLeafIcon {...richIconProps} />;
  if (has('early years')) return <FaChild {...richIconProps} />;
  if (has('education', 'teaching', 'coaching')) return <FaChalkboardTeacher {...richIconProps} />;

  return <GraduationCap {...iconProps} />;
}
