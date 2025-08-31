import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        {/* 404 일러스트 */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
          <div className="text-6xl mb-4">😕</div>
        </div>

        {/* 메시지 */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          페이지를 찾을 수 없습니다
        </h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          URL을 다시 확인해주세요.
        </p>

        {/* 액션 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="secondary"
            size="lg"
          >
            이전 페이지로
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            variant="primary"
            size="lg"
          >
            홈으로 가기
          </Button>
        </div>

        {/* 추가 도움말 */}
        <div className="mt-12 text-sm text-gray-500">
          <p>계속 문제가 발생한다면:</p>
          <ul className="mt-2 space-y-1">
            <li>• 브라우저를 새로고침 해보세요 (F5)</li>
            <li>• URL이 올바른지 확인해주세요</li>
            <li>• 캐시를 삭제해보세요</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;