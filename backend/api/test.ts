export default function handler(req: any, res: any) {
  res.status(200).json({
    message: 'Vercel is working!',
    timestamp: new Date().toISOString()
  });
}
